const links = document.querySelectorAll('.toc-link');
const sections = document.querySelectorAll('section[id]');

if (links.length > 0 && sections.length > 0) {
    window.addEventListener('scroll', () => {
        let activeIds = [];
        const detectionPoint = window.scrollY + 150; 

        let currentTop = -1;
        for (let i = 0; i < sections.length; i++) {
            if (detectionPoint >= sections[i].offsetTop) {
                currentTop = sections[i].offsetTop;
            } else {
                break;
            }
        }

        if (currentTop !== -1) {
            sections.forEach(section => {
                if (Math.abs(section.offsetTop - currentTop) < 10) {
                    activeIds.push(section.getAttribute('id'));
                }
            });
        }

        const isBottom = (window.innerHeight + window.scrollY) >= document.body.offsetHeight - 100;
        if (isBottom) {
            const lastTop = sections[sections.length - 1].offsetTop;
            activeIds = [];
            sections.forEach(section => {
                if (Math.abs(section.offsetTop - lastTop) < 10) {
                    activeIds.push(section.getAttribute('id'));
                }
            });
        }

        links.forEach(link => {
            link.classList.remove('active-toc');
            const targetId = link.getAttribute('href').replace('#', '');
            if (activeIds.includes(targetId)) {
                link.classList.add('active-toc');
            }
        });
    });
}

function escapeHTML(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function updateSteamTracker() {
    const playerText = document.getElementById('steam-players');
    const statusText = document.getElementById('steam-update-status');
    
    if (!playerText || !statusText) return;

    const cachedData = sessionStorage.getItem('seumSteamCache');
    const cacheTime = sessionStorage.getItem('seumSteamTime');
    const now = new Date().getTime();
    
    if (cachedData && cacheTime && (now - cacheTime < 300000)) {
        const parsed = JSON.parse(cachedData);
        playerText.innerHTML = parsed.players;
        statusText.innerHTML = parsed.status;
        return; 
    }

    const proxy = "https://api.allorigins.win/get?url=";
    try {
        let finalPlayersHTML = "Counting runners...";
        let finalStatusHTML = "Checking Steam...";

        const pUrl = encodeURIComponent("https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=457210");
        const pRes = await fetch(proxy + pUrl);
        const pData = await pRes.json();
        const pObj = JSON.parse(pData.contents);
        
        if (pObj && pObj.response && pObj.response.player_count !== undefined) {
            const safePlayerCount = escapeHTML(pObj.response.player_count);
            finalPlayersHTML = `<span style="color:#ff4500; font-size:1.2em; font-weight:bold;">${safePlayerCount}</span> players online`;
            playerText.innerHTML = finalPlayersHTML;
        }

        const nUrl = encodeURIComponent("https://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=457210&count=1");
        const nRes = await fetch(proxy + nUrl);
        const nData = await nRes.json();
        const nObj = JSON.parse(nData.contents);

        if (nObj && nObj.appnews && nObj.appnews.newsitems && nObj.appnews.newsitems.length > 0) {
            const news = nObj.appnews.newsitems[0];
            const date = new Date(news.date * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            
            const safeTitle = escapeHTML(news.title);
            const safeUrl = escapeHTML(news.url);
            const safeDate = escapeHTML(date);
            
            finalStatusHTML = `
                <span style="font-size: 0.75em; color: #666; text-transform: uppercase; border-bottom: 1px dashed #333; padding-bottom: 3px; display: inline-block; margin-bottom: 6px;">📢 Official Devs News</span><br>
                <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="color:#ffaa00; font-weight:bold; font-size:0.95em; line-height: 1.4; display: block; margin-bottom: 5px;">${safeTitle}</a>
                <span style="color:#888; font-size:0.85em;">Posted: ${safeDate}</span>
                <div style="margin-top: 10px; border-top: 1px solid #222; padding-top: 5px;">Status: <span style="color:#55ff55;">Live & Active</span></div>
            `;
            statusText.innerHTML = finalStatusHTML;
        }
        sessionStorage.setItem('seumSteamCache', JSON.stringify({
            players: finalPlayersHTML,
            status: finalStatusHTML
        }));
        sessionStorage.setItem('seumSteamTime', now.toString());

    } catch (error) {
        playerText.innerText = "Stats offline.";
        statusText.innerText = "Check SteamDB for details.";
    }
}

updateSteamTracker();