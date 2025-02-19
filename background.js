let jobs = [];
let start = false;

function addPageToUrl(url) {
    const regex = /page=(\d+)/;
    const match = url.match(regex);
    const page = (match && match[1]) || '1';
    const newPage = parseInt(page) + 1;

    return url.replace(regex, `page=${newPage}`);
}

async function changeTabToNextPage(url, tabId) {
    const newUrl = addPageToUrl(url);
    await chrome.tabs.update(tabId, { url: newUrl });

}

chrome.runtime.onConnect.addListener(function (port) {
    port.onMessage.addListener(async function (params, sender) {
        const { cmd } = params;
        if (cmd == "start") {
            start = true;
            const [tab] = await chrome.tabs.query({
                active: true,
                currentWindow: true,
            });

            let port = chrome.tabs.connect(tab.id, { name: 'bg-content_script' });
            port.postMessage({ cmd: 'scrap' });
        };
        if (cmd == "online") {
            const { sender: { tab: { id }, }, } = sender;

            if (start) {
                let port = chrome.tabs.connect(id, { name: 'bg-content_script' });
                port.postMessage({ cmd: 'scrap' });
            }
        }
        if (cmd == "getInfo") {
            const { jobsInformation, nextPage } = params;
            jobs = [...jobs, ...jobsInformation];

            if (nextPage) {
                const { sender: { tab: { url, id }, }, } = sender;
                changeTabToNextPage(url, id);
            } else {
                chrome.storage.local.set({ "jobs": jobs });
                start = false;
            }
        }
    })
})