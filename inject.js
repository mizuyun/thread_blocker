/* inject.js */

// Extract variables needed for the GraphQL API calls
// We look in window objects typically set by Meta/Instagram/Threads
function getSessionData() {
    let fb_dtsg = '';
    let lsd = '';
    let app_id = '238260118697367'; // From the user's cURL
    let has_error = false;

    try {
        // Attempt to parse RequireProvider or similarly stored modules containing session info
        if (window.require) {
            // Just a common fallback extraction method
            // Actually, Threads often exposes it in window.require("DTSGInitialData").token 
            try {
                fb_dtsg = window.require("DTSGInitialData").token;
            } catch (e) { }
            try {
                lsd = window.require("LSD").token;
            } catch (e) { }
        }
    } catch (e) { }

    // Another common place is in script tags with token data
    if (!fb_dtsg) {
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
            const text = script.textContent;
            if (text.includes('"token"')) {
                const dtsgMatch = text.match(/"DTSGInitialData",\[\],\{"token":"([^"]+)"\}/);
                if (dtsgMatch) fb_dtsg = dtsgMatch[1];

                const lsdMatch = text.match(/"LSD",\[\],\{"token":"([^"]+)"\}/);
                if (lsdMatch) lsd = lsdMatch[1];
            }
        }
    }

    return { fb_dtsg, lsd, app_id };
}

// Find the closest React Fiber node from a DOM element
function getReactFiber(node) {
    const key = Object.keys(node).find(key => key.startsWith('__reactFiber$'));
    return key ? node[key] : null;
}

// Walk up the Fiber tree to find user data
function findUserIdInFiber(fiber) {
    let current = fiber;
    while (current) {
        try {
            // Look for the user object in props or memoizedProps
            const props = current.memoizedProps || current.pendingProps;
            if (props) {
                // Threads posts usually have a `post` or `threadItem` object
                const post = props.post || props.threadItem || props.item || props.result;
                if (post && post.user && post.user.id) {
                    return post.user.id;
                }

                // Sometimes it's directly on props
                if (props.user && props.user.id) {
                    return props.user.id;
                }

                // specific link checks
                if (props.href && props.userID) return props.userID;
                if (props.href && props.hovercard_user_id) return props.hovercard_user_id;
            }
        } catch (e) {
            // Ignore
        }
        current = current.return;
    }
    return null;
}

async function performBlock(userId, fb_dtsg, lsd, app_id) {
    const url = "https://www.threads.com/api/graphql";

    // Variables structure according to the provided cURL
    const variables = {
        "user_id": userId,
        "container_module": "ig_text_feed_profile",
        "media_id": null,
        "ranking_info_token": null,
        "barcelona_source_quote_post_id": null,
        "barcelona_source_reply_id": null
    };

    const data = new URLSearchParams();
    data.append('av', '0'); // Generally user ID or 0
    data.append('__user', '0');
    data.append('__a', '1');
    data.append('__req', 'z');
    data.append('__hs', '20506.HYP:barcelona_web_pkg.2.1...0');
    data.append('dpr', '1');
    data.append('__ccg', 'EXCELLENT');
    data.append('__rev', '1033851049');
    data.append('__s', '');
    data.append('__hsi', '');
    data.append('__dyn', '');
    data.append('__csr', '');
    data.append('__comet_req', '29');
    data.append('fb_dtsg', fb_dtsg);
    data.append('jazoest', '26403');
    data.append('lsd', lsd);
    data.append('__spin_r', '1033851049');
    data.append('__spin_b', 'trunk');
    data.append('__spin_t', Math.floor(Date.now() / 1000).toString());
    data.append('fb_api_caller_class', 'RelayModern');
    data.append('fb_api_req_friendly_name', 'useTHUserBlockMutation');
    data.append('server_timestamps', 'true');
    data.append('variables', JSON.stringify(variables));
    data.append('doc_id', '25603164199300917');

    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-FB-Friendly-Name': 'useTHUserBlockMutation',
        'X-ASBD-ID': '359341',
        'X-IG-App-ID': app_id,
        'Priority': 'u=0'
    };

    if (lsd) {
        headers['X-FB-LSD'] = lsd;
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: data.toString()
    });

    const text = await response.text();
    const json = JSON.parse(text.split('\n')[0]); // Sometimes responses are multi-line JSON (streaming)
    return json;
}

window.addEventListener('message', async (event) => {
    if (event.source !== window || !event.data || event.data.type !== 'THREADS_QUICK_BLOCK_REQUEST') {
        return;
    }

    const blockId = event.data.blockId;
    const button = document.querySelector(`[data-block-id="${blockId}"]`);

    if (!button) {
        console.error("Block button not found in DOM");
        return;
    }

    const { fb_dtsg, lsd, app_id } = getSessionData();

    if (!fb_dtsg) {
        window.postMessage({ type: 'THREADS_QUICK_BLOCK_RESULT', success: false, error: 'Could not find fb_dtsg token' }, '*');
        return;
    }

    // Strategy 1: Find the closest common ancestor container that holds the author link
    let container = button;
    let authorLinks = [];
    while (container && container !== document.body) {
        // Look for links that start with /@ and are not post links (don't contain /post/)
        authorLinks = Array.from(container.querySelectorAll('a[href^="/@"]')).filter(a => !a.href.includes('/post/'));
        if (authorLinks.length > 0) {
            break;
        }
        container = container.parentElement;
    }

    // Now extract from the container's Fiber or the author link's Fiber
    let userId = null;
    if (container && authorLinks.length > 0) {
        // Try the container itself first
        let fiber = getReactFiber(container);
        if (fiber) userId = findUserIdInFiber(fiber);

        // Try the author links if container didn't have it
        if (!userId) {
            for (const link of authorLinks) {
                let f = getReactFiber(link);
                if (f) {
                    userId = findUserIdInFiber(f);
                    if (userId) break;
                }
            }
        }
    }

    // Strategy 2: Search up to 50 levels deep (Original method)
    if (!userId) {
        let currentElement = button;
        for (let i = 0; i < 50; i++) {
            if (!currentElement) break;
            const fiber = getReactFiber(currentElement);
            if (fiber) {
                userId = findUserIdInFiber(fiber);
                if (userId) break;
            }
            currentElement = currentElement.parentElement;
        }
    }

    if (!userId) {
        // Fallback: Check if we are on a user profile page and use their ID from the page state 
        // This is less reliable for feed, but good for profile
        try {
            userId = window.require("RelayModern").__environment.getStore().getSource().getRecord("client:root").getValue("user_id");
        } catch (e) { }
    }

    if (!userId) {
        console.error("DOM at failure:", button.closest('.x1xdureb') ? button.closest('.x1xdureb').innerHTML : "No container");
        window.postMessage({ type: 'THREADS_QUICK_BLOCK_RESULT', success: false, error: 'Could not resolve user ID from Fiber' }, '*');
        return;
    }

    try {
        const result = await performBlock(userId, fb_dtsg, lsd, app_id);

        // Check if the API returned an error or the block state
        if (result.data && result.data.record && result.data.record.user) {
            window.postMessage({ type: 'THREADS_QUICK_BLOCK_RESULT', success: true, response: result }, '*');
            // Visually indicate success by tinting the button red
            button.style.color = '#ff3040';
            button.querySelector('title').textContent = 'Blocked';
        } else {
            window.postMessage({ type: 'THREADS_QUICK_BLOCK_RESULT', success: false, error: 'API did not return expected block state', response: result }, '*');
        }
    } catch (error) {
        window.postMessage({ type: 'THREADS_QUICK_BLOCK_RESULT', success: false, error: error.message }, '*');
    }
});
