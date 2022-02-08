let parser = new DOMParser();
let fleetInStaking = [];
let animateStar = false;
let getMarketDataApiRunning = false;
let oldUpdateCoinPrice;
let cvf = 0.0; //current value market usdc lower ask
let tpr = 0.0; //total pending rewards
let cacheShipData;
let versione = '4.2 08/02/2022';

let extSetting = {
    ext001: "YES",
    ext002: "YES",
    ext003: "YES",
    ext004: "YES",
    ext005: "YES",
    ext006: "YES",
    ext007: "YES",
    ext008: "YES",
    ext009: "YES",
    ext010: "YES"
}

function myLog(text) {
    console.log('SA_EXT: ' + text);
}

myLog('load extension');

document.onkeydown = function (event) {
    if (event.altKey && event.code == "KeyP") {
        var el = document.getElementById('divPrice');
        if (el.style.display == 'none') {
            el.style.display = 'block';
        } else {
            el.style.display = 'none';
        }
    }
    if (event.altKey && event.code == "KeyG") {
        window.open("https://lnk.totemzetasoft.it/starAtlas/roi.html");
    }
};

window.addEventListener('message', function (event) {
    if (event.data.func == 'closeRoiWindow') {
        document.getElementById('divChart').style.display = 'none';
        document.activeElement.blur();
    }
}, false);

//load extSetting from localstorage if exists
if (localStorage.extSetting) {
    extSetting = JSON.parse(localStorage.extSetting);
    if (!extSetting.ext009) {
        extSetting.ext009 = "YES";
    }
    if (!extSetting.ext010) {
        extSetting.ext010 = "YES";
    }
}

var formatterUSD = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
});

var formatterNr = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2
});

setInterval(checkMenu, 500);

function checkMenu() {
    initPriceCoin();

    //create extension menu if not exists
    if (!document.getElementById('mnuAtlasTool')) {
        myLog('create extension menu');
        var navMenu = document.querySelectorAll(`div[class^="NavItemstyles__"]`);

        var template = `
            <div id='mnuAtlasTool' style='left: 0px; bottom: -133px; position: absolute; width: 80px;'>
                <div style='display: flex; flex-flow: column'>
                    <div id='mnuSetting' style="width: 100%; background-position: center; background-size: 36px; height: 40px; cursor: pointer; background-image: url('data:image/png;base64,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'); background-repeat: no-repeat">
                    </div> 
                    <div id='divCvf' title='Current value of fleet (click for refresh)' style='letter-spacing: 0.1em; cursor: pointer; user-select: none; margin: auto; font-size: 18px; padding-top: 5px'>
                    </div> 
                    <div id='divTnf' title='Net farm atlas for one day (click for refresh)' style='letter-spacing: 0.1em; cursor: pointer; user-select: none; margin: auto; font-size: 18px; padding-top: 5px'>
                    </div> 
                    <div id='divTpr' title='Total pending rewards' style='letter-spacing: 0.1em; user-select: none; margin: auto; font-size: 18px; padding-top: 5px'>
                    </div>                     
                <div>
            </div>
        `;

        navMenu[navMenu.length - 2].parentElement.parentElement.insertBefore(createElementFromHTML(template, 'mnuAtlasTool'), null);
        document.getElementById('mnuSetting').onclick = function () {
            var wnd = document.getElementById('wndAtlasTool');
            wnd.style.display = 'flex';
        };
        document.getElementById('divCvf').onclick = function () {
            var el = document.getElementById('divCvf');
            el.style.pointerEvents = 'none';
            el.style.color = 'gray';
            getMarketDataApi(0, retrieveCvf);
        };
        document.getElementById('divTnf').onclick = function () {
            var el = document.getElementById('divTnf');
            el.style.pointerEvents = 'none';
            el.style.color = 'gray';
            getMarketDataApi(0, retrieveTnfDay);
        };

        if (!document.getElementById('wndAtlasTool')) {
            var templateExtWindow = `
            <div id='wndAtlasTool' style='display: none; align-items: center; justify-content: center; top: 0; z-index: 1; position:absolute; width: 100%; height: 100%;'>
                <div style='position: relative; padding: 10px; border-radius: 10px; box-shadow: 0px 0px 40px 5px #000; width: 400px; height: 500px; background: #1e1d25'>
                    <div style='font-size: 10px; position:absolute; bottom: 10px; left: 10px; color: white; font-family: industryMedium; '>
                        <a style='text-decoration: underline;' target="_blank" href='https://lnk.totemzetasoft.it/starAtlas/guida.html?v=4_1'>${versione}</a>
                    </div>     
                    <div style='margin-top: 10px; height: 400px; overflow-yoverflow-y: ;overflow-y: scroll;'>
                        <div style='border-bottom: solid 1px wheat; color: white; display: flex; justify-content: center; align-items: center; display:flex; height: 45px; font-family: industryMedium; '>
                            ALT + p --> show/hide coin prices window                
                        </div>   
                        <div style='border-bottom: solid 1px wheat; color: white; display: flex; justify-content: center; align-items: center; display:flex; height: 45px; font-family: industryMedium; '>
                            ALT + g --> show/hide Roi Tool              
                        </div>                            
                        <div style='display:flex; height: 45px; font-family: industryMedium; '>
                            <div style='display: flex; justify-content:center; align-items: center; width: 300px; color: white; flex: 0 1 auto'>
                                Show origination price
                            </div>
                            <div id="ext001" class='optionExt' style='cursor:pointer; display: flex; justify-content:center; align-items: center; color: ${extSetting.ext001 == "YES" ? "orange" : "gray"}; display: flex; flex: 1 1 auto'>
                                ${extSetting.ext001}
                            </div>                        
                        </div>
                        <div style='display:flex; height: 45px; font-family: industryMedium; '>
                            <div style='display: flex; justify-content:center; align-items: center; width: 300px; color: white; flex: 0 1 auto'>
                                Show vwap price
                            </div>
                            <div id="ext002" class='optionExt' style='cursor:pointer; display: flex; justify-content:center; align-items: center; color: ${extSetting.ext002 == "YES" ? "orange" : "gray"}; display: flex; flex: 1 1 auto'>
                                ${extSetting.ext002}
                            </div>                        
                        </div>  
                        <div style='display:flex; height: 45px; font-family: industryMedium; '>
                            <div style='display: flex; justify-content:center; align-items: center; width: 300px; color: white; flex: 0 1 auto'>
                                Show lower ask $
                            </div>
                            <div id="ext003" class='optionExt' style='cursor:pointer; display: flex; justify-content:center; align-items: center; color: ${extSetting.ext003 == "YES" ? "orange" : "gray"}; display: flex; flex: 1 1 auto'>
                                ${extSetting.ext003}
                            </div>                        
                        </div>   
                        <div style='display:flex; height: 45px; font-family: industryMedium; '>
                            <div style='display: flex; justify-content:center; align-items: center; width: 300px; color: white; flex: 0 1 auto'>
                                Show lower ask &#916;
                            </div>
                            <div id="ext004" class='optionExt' style='cursor:pointer; display: flex; justify-content:center; align-items: center; color: ${extSetting.ext004 == "YES" ? "orange" : "gray"}; display: flex; flex: 1 1 auto'>
                                ${extSetting.ext004}
                            </div>                        
                        </div>      
                        <div style='display:flex; height: 45px; font-family: industryMedium; '>
                            <div style='display: flex; justify-content:center; align-items: center; width: 300px; color: white; flex: 0 1 auto'>
                                Show earn &#916;
                            </div>
                            <div id="ext005" class='optionExt' style='cursor:pointer; display: flex; justify-content:center; align-items: center; color: ${extSetting.ext005 == "YES" ? "orange" : "gray"}; display: flex; flex: 1 1 auto'>
                                ${extSetting.ext005}
                            </div>                        
                        </div>   
                        <div style='border-bottom: solid 1px wheat; display:flex; height: 45px; font-family: industryMedium; '>
                            <div style='display: flex; justify-content:center; align-items: center; width: 300px; color: white; flex: 0 1 auto'>
                                Show cost &#916;
                            </div>
                            <div id="ext006" class='optionExt' style='cursor:pointer; display: flex; justify-content:center; align-items: center; color: ${extSetting.ext006 == "YES" ? "orange" : "gray"}; display: flex; flex: 1 1 auto'>
                                ${extSetting.ext006}
                            </div>                        
                        </div>  
                        <div style='display:flex; height: 45px; font-family: industryMedium; '>
                            <div style='display: flex; justify-content:center; align-items: center; width: 300px; color: white; flex: 0 1 auto'>
                                Show warp speed effect
                            </div>
                            <div id="ext007" class='optionExt' style='cursor:pointer; display: flex; justify-content:center; align-items: center; color: ${extSetting.ext007 == "YES" ? "orange" : "gray"}; display: flex; flex: 1 1 auto'>
                                ${extSetting.ext007}
                            </div>                        
                        </div>    
                        <div style='display:flex; height: 45px; font-family: industryMedium; '>
                            <div style='display: flex; justify-content:center; align-items: center; width: 300px; color: white; flex: 0 1 auto'>
                                Show resource countdown 
                            </div>
                            <div id="ext008" class='optionExt' style='cursor:pointer; display: flex; justify-content:center; align-items: center; color: ${extSetting.ext008 == "YES" ? "orange" : "gray"}; display: flex; flex: 1 1 auto'>
                                ${extSetting.ext008}
                            </div>                        
                        </div>  
                        <div style='display:flex; height: 45px; font-family: industryMedium; '>
                            <div style='display: flex; justify-content:center; align-items: center; width: 300px; color: white; flex: 0 1 auto'>
                                Fix website layout error 
                            </div>
                            <div id="ext009" class='optionExt' style='cursor:pointer; display: flex; justify-content:center; align-items: center; color: ${extSetting.ext009 == "YES" ? "orange" : "gray"}; display: flex; flex: 1 1 auto'>
                                ${extSetting.ext009}
                            </div>                        
                        </div>       
                        <div style='display:flex; height: 45px; font-family: industryMedium; '>
                            <div style='display: flex; justify-content:center; align-items: center; width: 300px; color: white; flex: 0 1 auto'>
                                Hide cvf and tfn in home page
                            </div>
                            <div id="ext010" class='optionExt' style='cursor:pointer; display: flex; justify-content:center; align-items: center; color: ${extSetting.ext010 == "YES" ? "orange" : "gray"}; display: flex; flex: 1 1 auto'>
                                ${extSetting.ext010}
                            </div>                        
                        </div>                                                                                                                                                                                          
                    </div>
                    <div id='wndAtlasTool_close' style='margin-top: 20px; cursor: pointer; color: white; display: flex; justify-content: center; align-items: center; display:flex; height: 45px; font-family: industryMedium; '>
                        CLOSE                
                    </div>       
                <div>            
            </div>
        `;

            document.body.insertBefore(createElementFromHTML(templateExtWindow, 'wndAtlasTool'), null);
            var optionExt = document.getElementsByClassName('optionExt');
            for (var x = 0; x < optionExt.length; x++) {
                optionExt[x].onclick = optionExt_click;
            }

            document.getElementById('wndAtlasTool_close').onclick = function () {
                document.getElementById('wndAtlasTool').style.display = "none";
            }
        }
    }

    if (location.href.includes('/market/')) {
        var headerMarketType = document.querySelector(`span[class^="styles__DexHeaderTextWrapper-"]`);
        if (headerMarketType &&
            headerMarketType.innerText.toLocaleLowerCase().startsWith('resource ')) {
            var tabs = document.querySelectorAll(`div[class^="styles__StyledTab-"]`);
            if (tabs.length >= 3 && tabs[2].innerText.toLowerCase() == 'trade' &&
                tabs[2].classList.contains('tabSelected')) {
                initBuyResources();
            } else {
                if (document.getElementById('buyDay')) {
                    document.getElementById('buyDay').style.display = 'none';
                }
            }
        }
    }

    if (location.href.endsWith('/market') || location.href.endsWith('=ship')) {
        //myLog('current menu: ships');

        if (!document.getElementById('x001')) {
            getMarketDataApi(0, processShip);
        }
    }

    if (location.href.includes('/fleet')) {
        animateStar = extSetting.ext007 == "YES";

        if (extSetting.ext007 == "YES" && !document.getElementById('starCanvas')) {
            var container = document.querySelectorAll(`div[class^="FleetDashboardItemstyles__Header"]`);
            if (container.length > 0) {
                myLog('load iperspace effect');
                for (var x = 0; x < container.length; x++) {
                    initStar(container[x]);
                }
            }
        }

        //retrieve fleet in staking
        fleetInStaking.length = 0;
        tpr = 0;
        var fleet = document.querySelectorAll(`p[class^="FleetDashboardItemstyles__FleetName-"]`);
        for (var x = 0; x < fleet.length; x++) {
            var obj = {};
            obj.name = fleet[x].innerText.toLowerCase();
            obj.nr = parseInt(fleet[x].parentElement.parentElement.parentElement.querySelectorAll(`span[class^="ItemDetailDimensionstyles__ItemDetailDimensionValue-"]`)[1].innerText);

            var tmp = fleet[x].parentElement.parentElement.parentElement.parentElement.querySelectorAll(`span[class^="FleetRewardsTextstyles__FleetRewardsValue-"]`);
            tpr += parseFloat(tmp[tmp.length - 1].innerText.split(' '));

            fleetInStaking.push(obj);
        }

        //Total pending rewards
        var el = document.getElementById('divTpr');
        if (el) {
            if (extSetting.ext010 == "YES") {
                el.innerText = 'xxx';
            } else {
                if (tpr == 0) {
                    el.innerText = '';
                } else {
                    el.innerText = formatterNr.format(tpr);
                }
            }
            el.style.color = 'white';
        }

        //hourly resource calculation
        if (cacheShipData) {
            setHourBurn(cacheShipData);
        }

        //cvf
        if (cacheShipData) {
            retrieveCvf(cacheShipData);
        }

        //insert monthly rewards
        if (!document.getElementById('monthlyRewards')) {
            var fleet = document.querySelectorAll(`p[class^="FleetDashboardItemstyles__FleetName-"]`);
            if (fleet.length > 0) {
                myLog('load monthly rewards');
                getMarketDataApi(0, monthlyRewards);
            }
        }
    } else {
        animateStar = false;
    }

    if (location.href.includes('/inventory') &&
        document.getElementsByClassName('tabSelected ')[0].innerText.toLowerCase() == 'resources') {

        // console.log('im in inventory');

        if (extSetting.ext008 == 'YES') {
            if (!document.getElementById('resourceTimer')) {
                if (fleetInStaking.length == 0) {
                    if (!document.getElementById('tabTitle')) {
                        var tabTitle = document.querySelector(`h3[class^="TabCardstyles__Title-"]`);
                        if (tabTitle) {
                            tabTitle.insertBefore(createElementFromHTML(`<label id='tabTitle' style="display: block; color: white; text-transform: none; font-size: 14px">To view the expected consumption burn, first go to the "Faction Fleet" menu and then come back here.</label>`, 'tabTitle'), null);
                        }
                    }
                } else {
                    getMarketDataApi(0, checkResourceConsuming);
                }
            }
        } else {
            var el = document.getElementById('resourceTimer');
            while (el) {
                el.outerHTML = '';
                el = document.getElementById('resourceTimer');
            }
        }
    }
    if (location.href.includes('/profile/') && extSetting.ext009 == "YES") {
        var el = document.querySelector(`div[class^="styles__HeaderTabsContainer-"]`);
        if (el) {
            el.nextElementSibling.style.minHeight = "";
            el.nextElementSibling.style.overflowY = "auto";
        }
    }
}
function processShip(shipData) {
    myLog('process data ship');

    setTimeout(function () {
        retrieveCvf(shipData);
    }, 1000);

    var elements = document.querySelectorAll('h3[class^="poster__PosterCountLarge-"]');
    for (var x = 0; x < elements.length; x++) {
        var shipInfo = shipData.filter(function (el) {
            return el.name == elements[x].innerText.toLocaleLowerCase();
        });

        if (shipInfo.length == 1) {
            var template = `
                <span id='x001' style="font-family: Graphik; font-style: normal; font-weight: normal; font-size: 12px; line-height: 16px; text-align: center; text-transform: none; color: rgb(146, 146, 150);">
            `;

            if (extSetting.ext001 == "YES") {
                template += `origination: ${formatterUSD.format(shipInfo[0].op)}<br>`;
            }
            if (extSetting.ext002 == "YES") {
                template += `vwap: ${formatterUSD.format(shipInfo[0].price)}<br>`;
            }
            if (extSetting.ext003 == "YES") {
                template += `lower ask $: ${formatterUSD.format(shipInfo[0].lau)}<br>`;
            }
            if (extSetting.ext004 == "YES") {
                template += `lower ask &#916;/$: ${formatterNr.format(shipInfo[0].laa)}<br>`;
            }
            if (extSetting.ext005 == "YES") {
                template += `earn: ${formatterNr.format(shipInfo[0].rgl)} &#916;/day<br>`;
            }
            if (extSetting.ext005 == "YES" &&
                extSetting.ext006 == "YES") {
                template += `earn (net): ${formatterNr.format(shipInfo[0].rgl - shipInfo[0].cg)} &#916;/day<br>`;
            }
            if (extSetting.ext006 == "YES") {
                template += `cost: ${formatterNr.format(shipInfo[0].cg)} &#916;/day`;
            }

            template += "</span>";

            elements[x].insertBefore(createElementFromHTML(template, "x001"), null);
        }
    }
}
function checkResourceConsuming(shipData) {
    var templateTimer = `
        <span id='resourceTimer' style="margin: auto; display: flex; justify-content: center" class="DepletionTimerstyles__DepletionTimerWrapper-eJIqPG daWBlT">
            <span style="margin-right: 7px" class="DepletionTimerstyles__DepletionTimerIconWrapper-cdqVzB eprLwU">
                <div>
                    <div>
                        <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg"
                            class="injected-svg"
                            data-src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTciIHZpZXdCb3g9IjAgMCAxNiAxNyIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTcuOTk5NjcgMTUuMTY2OEMxMS42ODE2IDE1LjE2NjggMTQuNjY2MyAxMi4xODIxIDE0LjY2NjMgOC41MDAxNkMxNC42NjYzIDQuODE4MjYgMTEuNjgxNiAxLjgzMzUgNy45OTk2NyAxLjgzMzVDNC4zMTc3OCAxLjgzMzUgMS4zMzMwMSA0LjgxODI2IDEuMzMzMDEgOC41MDAxNkMxLjMzMzAxIDEyLjE4MjEgNC4zMTc3OCAxNS4xNjY4IDcuOTk5NjcgMTUuMTY2OFoiIHN0cm9rZT0iIzMyRkVGRiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNOCA0LjVWOC41TDEwLjY2NjcgOS44MzMzMyIgc3Ryb2tlPSIjMzJGRUZGIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo="
                            xmlns:xlink="http://www.w3.org/1999/xlink">
                            <path
                                d="M7.99967 15.1668C11.6816 15.1668 14.6663 12.1821 14.6663 8.50016C14.6663 4.81826 11.6816 1.8335 7.99967 1.8335C4.31778 1.8335 1.33301 4.81826 1.33301 8.50016C1.33301 12.1821 4.31778 15.1668 7.99967 15.1668Z"
                                stroke="#32FEFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                            <path d="M8 4.5V8.5L10.6667 9.83333" stroke="#32FEFF" stroke-width="1.5" stroke-linecap="round"
                                stroke-linejoin="round"></path>
                        </svg>
                    </div>
                </div>
            </span>
            <span style="font-size: 24px; color: rgb(50, 254, 255); text-shadow: rgb(31, 175, 175) 0px 0px 4px; letter-spacing: 0.04em; font-weight: 500; font-family: 'industryMedium'">
                ??D:??H
            </span>
        </span>        
    `;

    var resources = document.querySelectorAll(`h3[class^="poster__PosterCountLarge-"]`);
    var totalFdH = 0;
    var totalFudH = 0;
    var totalAdH = 0;
    var totalRdH = 0;
    var vDay = 0;
    var vHour = 0;
    var vValue = 0.0;

    //Calculate daily consuming
    for (var x = 0; x < fleetInStaking.length; x++) {
        var shipInfo = shipData.filter(function (el) {
            return el.name == fleetInStaking[x].name;
        });

        if (shipInfo.length == 1) {
            totalFdH += fleetInStaking[x].nr * shipInfo[0].fdT;
            totalFudH += fleetInStaking[x].nr * shipInfo[0].fudT;
            totalAdH += fleetInStaking[x].nr * shipInfo[0].adT;
            totalRdH += fleetInStaking[x].nr * shipInfo[0].rdT;
        }
    }

    for (var x = 0; x < resources.length; x++) {
        switch (resources[x].innerText.toLocaleLowerCase()) {
            case "fuel":
                vValue = parseFloat(resources[x].closest('div').querySelector(`p[class^="generic__StatValue-"]`).innerText.split(" ")[0]) / totalFudH;
                break;
            case "food":
                vValue = parseFloat(resources[x].closest('div').querySelector(`p[class^="generic__StatValue-"]`).innerText.split(" ")[0]) / totalFdH;
                break;
            case "ammunition":
                vValue = parseFloat(resources[x].closest('div').querySelector(`p[class^="generic__StatValue-"]`).innerText.split(" ")[0]) / totalAdH;
                break;
            case "toolkit":
                vValue = parseFloat(resources[x].closest('div').querySelector(`p[class^="generic__StatValue-"]`).innerText.split(" ")[0]) / totalRdH;
                break;
        }

        vDay = Math.trunc(vValue);
        vHour = Math.trunc((vValue - vDay) * 24);
        var data = templateTimer.replace('??D', vDay + 'D');
        data = data.replace('??H', ('00' + vHour).slice(-2) + 'H');

        resources[x].insertBefore(createElementFromHTML(data, 'resourceTimer'), null);
    }
}
function monthlyRewards(shipData) {
    var data = '';
    var template = `
            <span id="monthlyRewards" style="margin-left: 30px" class="FleetRewardsTextstyles__FleetRewardsTextWrapper-hqStiK fCTZhu">
                <span class="FleetRewardsTextstyles__FleetRewardsLabel-jconmC iKOHVX">Net Monthly Rewards</span>
                <span class="FleetRewardsTextstyles__FleetRewardsValue-eIKJuX fXNYKC">??? ATLAS</span>
            </span>      
    `;

    var fleet = document.querySelectorAll(`p[class^="FleetDashboardItemstyles__FleetName-"]`);
    for (var x = 0; x < fleet.length; x++) {
        var shipInfo = shipData.filter(function (el) {
            return el.name == fleet[x].innerText.toLocaleLowerCase();
        });

        if (shipInfo.length == 1) {
            var numFleet = parseInt(fleet[x].parentElement.parentElement.parentElement.querySelectorAll(`span[class^="ItemDetailDimensionstyles__ItemDetailDimensionValue-"]`)[1].innerText);
            data = template.replace("???", formatterNr.format((shipInfo[0].rgl - shipInfo[0].cg) * 30 * numFleet));
            var elements = fleet[x].closest("div").parentElement.parentElement.parentElement.querySelectorAll(`div[class^="FleetDashboardItemstyles__FleetRewardsTextWrapper-"]`);

            elements[0].style.display = "flex";
            elements[0].insertBefore(createElementFromHTML(data, "monthlyRewards"), null);
        }
    }
}
function setHourBurn(shipData) {
    var fleetCard = document.querySelectorAll(`div[class^="FleetDashboardItemstyles__DialogWrapper-"]`);
    var capacity = 0;
    var reseourceHour = 0;
    var resourceHourRemain = 0;
    var needResupply = false;

    for (var x = 0; x < fleetCard.length; x++) {
        needResupply = false;
        var fleetName = fleetCard[x].querySelector(`p[class^="FleetDashboardItemstyles__FleetName-"]`);

        if (fleetName) {
            var shipInfo = shipData.filter(function (el) {
                return el.name == fleetName.innerText.toLocaleLowerCase();
            });

            var fleetInfo = fleetInStaking.filter(function (el) {
                return el.name == fleetName.innerText.toLocaleLowerCase();
            });

            if (shipInfo.length == 1) {
                var lbl = fleetCard[x].querySelectorAll(`label[class^="ProgressBarstyles__Label-"]`);

                for (var y = 0; y < lbl.length; y += 2) {
                    switch (lbl[y].innerText.split(' ')[0].toLocaleLowerCase()) {
                        case "food":
                            capacity = shipInfo[0].fT; //capacity
                            reseourceHour = fleetInfo[0].nr * (shipInfo[0].fdT / 24); //hourly consumption
                            break;
                        case "fuel":
                            capacity = shipInfo[0].fuT;
                            reseourceHour = fleetInfo[0].nr * (shipInfo[0].fudT / 24);
                            break;
                        case "ammo":
                            capacity = shipInfo[0].aT;
                            reseourceHour = fleetInfo[0].nr * (shipInfo[0].adT / 24);
                            break;
                        case "health":
                            capacity = shipInfo[0].rT;
                            reseourceHour = fleetInfo[0].nr * (shipInfo[0].rdT / 24);
                            break;
                    }

                    if (capacity > 0 && reseourceHour > 0) {
                        resourceHourRemain = fleetInfo[0].nr * capacity * (parseFloat(lbl[y + 1].innerText.split('%')[0]) / 100);
                        resourceHourRemain = parseInt(resourceHourRemain / reseourceHour);

                        lbl[y].innerText = lbl[y].innerText.split(' ')[0] +
                            ' (' + resourceHourRemain + ' hour' +
                            (resourceHourRemain > 1 ? 's' : '') +
                            (resourceHourRemain < 8 ? ' !!!' : '') + ')';

                        if (resourceHourRemain < 6) {
                            needResupply = true;
                        }
                    }
                }

                var btn = fleetCard[x].getElementsByTagName('button')[2];
                if (needResupply) {
                    btn.style.borderStyle = 'none';
                    btn.style.background = 'red';
                    btn.getElementsByTagName('span')[1].style.display = 'none';
                } else {
                    btn.style.borderStyle = '';
                    btn.style.background = '';
                    btn.getElementsByTagName('span')[1].style.display = '';
                }
            }
        }
    }
}
function createElementFromHTML(htmlString, id) {
    var parsedHtml = parser.parseFromString(htmlString, 'text/html');
    return parsedHtml.getElementById(id);
}
function destroyStarCanvas() {
    var elements = document.getElementsByTagName('canvas');
    for (var x = 0; x < elements.length; x++) {
        if (elements[x].id == 'starCanvas') {
            elements[x].outerHTML = "";
        }
    }
}
function getMarketDataApi(type, callback) {
    if (getMarketDataApiRunning) {
        return;
    }
    getMarketDataApiRunning = true;
    callApi({ "action": "getMarketData", "type": type })
        .then(data => {
            cacheShipData = data;

            callback(data);
            getMarketDataApiRunning = false;
        });
}
async function callApi(data = {}) {
    const response = await fetch("https://lnk.totemzetasoft.it/starAtlas/api/services.php", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    return response.json();
}
function optionExt_click(sender) {
    var el = document.getElementById(sender.target.id);

    if (extSetting[el.id] == 'YES') {
        extSetting[el.id] = "NO";
        el.style.color = "gray";
    } else {
        extSetting[el.id] = "YES";
        el.style.color = "orange";
    }

    el.innerText = extSetting[el.id];

    localStorage.extSetting = JSON.stringify(extSetting);
}
function initPriceCoin() {
    if (!document.getElementById('divPrice')) {
        var template = `
            <div id='divPrice' style='display:none; user-select: none;padding: 10px; box-shadow:0px 0px 40px 5px #000; border-radius: 10px; z-index: 1000; width: 320px; height: 150px; background: white; position: absolute; top: 300px; left: 400px'>
                <div style='display: flex; padding-top: 10px'>
                    <div style='text-transform: uppercase; font-size:24px; font-family: tungstenBook; flex: 0 1 auto; height: 30px; width: 100px; display: flex; justify-content: center'>
                        atlas
                    </div>
                    <div id='priceAtlas' style='flex: 1 1 auto; height: 30px; margin-right: 10px'>
                    </div>
                </div>	
                <div style='display: flex; padding-top: 10px'>
                    <div style='text-transform: uppercase; font-size:24px; font-family: tungstenBook; flex: 0 1 auto; height: 30px; width: 100px; display: flex; justify-content: center'>
                        polis
                    </div>
                    <div id='pricePolis' style='flex: 1 1 auto; height: 30px; margin-right: 10px'>
                    </div>
                </div>	
                <div style='display: flex; padding-top: 10px'>
                    <div style='text-transform: uppercase; font-size:24px; font-family: tungstenBook; flex: 0 1 auto; height: 30px; width: 100px; display: flex; justify-content: center'>
                        solana
                    </div>
                    <div id='priceSolana' style='flex: 1 1 auto; height: 30px; margin-right: 10px'>
                    </div>
                </div>			
            </div>
        `;

        document.body.appendChild(createElementFromHTML(template, 'divPrice'), null);


        function makeDragable(dragHandle, dragTarget) {
            let dragObj = null; //object to be moved
            let xOffset = 0; //used to prevent dragged object jumping to mouse location
            let yOffset = 0;

            document.querySelector(dragHandle).addEventListener("mousedown", startDrag, true);
            document.querySelector(dragHandle).addEventListener("touchstart", startDrag, true);

            /*sets offset parameters and starts listening for mouse-move*/
            function startDrag(e) {
                e.preventDefault();
                e.stopPropagation();
                dragObj = document.querySelector(dragTarget);
                dragObj.style.position = "absolute";
                let rect = dragObj.getBoundingClientRect();

                if (e.type == "mousedown") {
                    xOffset = e.clientX - rect.left; //clientX and getBoundingClientRect() both use viewable area adjusted when scrolling aka 'viewport'
                    yOffset = e.clientY - rect.top;
                    window.addEventListener('mousemove', dragObject, true);
                } else if (e.type == "touchstart") {
                    xOffset = e.targetTouches[0].clientX - rect.left;
                    yOffset = e.targetTouches[0].clientY - rect.top;
                    window.addEventListener('touchmove', dragObject, true);
                }
            }

            /*Drag object*/
            function dragObject(e) {
                e.preventDefault();
                e.stopPropagation();

                if (dragObj == null) {
                    return; // if there is no object being dragged then do nothing
                } else if (e.type == "mousemove") {
                    dragObj.style.left = e.clientX - xOffset + "px"; // adjust location of dragged object so doesn't jump to mouse position
                    dragObj.style.top = e.clientY - yOffset + "px";
                } else if (e.type == "touchmove") {
                    dragObj.style.left = e.targetTouches[0].clientX - xOffset + "px"; // adjust location of dragged object so doesn't jump to mouse position
                    dragObj.style.top = e.targetTouches[0].clientY - yOffset + "px";
                }
            }

            /*End dragging*/
            document.onmouseup = function (e) {
                if (dragObj) {
                    dragObj = null;
                    window.removeEventListener('mousemove', dragObject, true);
                    window.removeEventListener('touchmove', dragObject, true);
                }
            }
        }

        makeDragable('#divPrice', '#divPrice');
    }

    if (document.getElementById('divPrice').style.display == 'block') {
        //update price
        if (!oldUpdateCoinPrice || ((new Date() - oldUpdateCoinPrice) / 1000 > 20)) {
            myLog('update coin price');

            var el = document.getElementById('priceAtlas');
            el.style.background = `url("https://lnk.totemzetasoft.it/starAtlas/api/price/star-atlas.png?t=${getTicks()}")`;
            el.style.backgroundRepeat = 'no-repeat';
            el.style.backgroundSize = 'cover';

            el = document.getElementById('pricePolis');
            el.style.background = `url("https://lnk.totemzetasoft.it/starAtlas/api/price/star-atlas-polis.png?t=${getTicks()}")`;
            el.style.backgroundRepeat = 'no-repeat';
            el.style.backgroundSize = 'cover';

            el = document.getElementById('priceSolana');
            el.style.background = `url("https://lnk.totemzetasoft.it/starAtlas/api/price/solana.png?t=${getTicks()}")`;
            el.style.backgroundRepeat = 'no-repeat';
            el.style.backgroundSize = 'cover';

            oldUpdateCoinPrice = new Date();
        }
    }
}
function getTicks() {
    var now = new Date();
    return now.getTime();
}
function retrieveCvf(shipData) {
    cvf = 0;

    for (var x = 0; x < fleetInStaking.length; x++) {
        var shipInfo = shipData.filter(function (el) {
            return el.name == fleetInStaking[x].name;
        });

        if (shipInfo.length == 1) {
            cvf += fleetInStaking[x].nr * shipInfo[0].lau;
        }
    }

    var el = document.getElementById('divCvf');
    if (el) {
        if (extSetting.ext010 == "YES") {
            el.innerHTML = '$xxx';
        } else {
            el.innerText = formatterUSD.format(cvf);
        }

        el.style.color = 'white';
        el.style.pointerEvents = 'all';
    }

    retrieveTnfDay(shipData);
}
function retrieveTnfDay(shipData) {
    //total net farm for one day
    var tnf = 0;

    for (var x = 0; x < fleetInStaking.length; x++) {
        var shipInfo = shipData.filter(function (el) {
            return el.name == fleetInStaking[x].name;
        });

        if (shipInfo.length == 1) {
            tnf += fleetInStaking[x].nr * (shipInfo[0].rgl - shipInfo[0].cg);
        }
    }

    var el = document.getElementById('divTnf');
    if (el) {
        if (extSetting.ext010 == "YES") {
            el.innerText = 'xxx/d';
        } else {
            el.innerText = formatterNr.format(tnf) + '/d';
        }
        el.style.color = 'white';
        el.style.pointerEvents = 'all';
    }
}
function initBuyResources() {
    var el = document.querySelector(`div[class^="NumberInputstyles__Wrapper-"]`);

    if (document.getElementById('buyDay') &&
        document.getElementById('buyDay').style.display == 'none') {
        document.getElementById('buyDay').style.display = 'block';
    }

    if (!document.getElementById('buyDay') && el && fleetInStaking.length > 0) {
        var template = `
        <div id='buyDay' style="margin-right: 15px;" class="NumberInputstyles__Wrapper-gnPFvn bExyxS NumberInputWrapper">
        <label>for x day</label>
        <span label="size" style="width: 101px" class="NumberInputstyles__InputWrapper-gLvgTt karCCD marketItemInput">
        <input id='buyDayTxt' readonly='true' type="number" style="width: 101px;" min="0" max="365" value="0">
            <span class="NumberInputstyles__ButtonWrapper-eUHVOh hlozAF">
                <button id='buyDayUp' class="NumberInputstyles__IncrementButton-gGByfb guingM">
                    <span style="opacity: 1;" class="styles__SAIcon-ijmsNY fLpDJB">
                        <span>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                                class="injected-svg sa-icon-svg" data-src="/icons/step-up-24.svg"
                                xmlns:xlink="http://www.w3.org/1999/xlink">
                                <g id="General/Step Up">
                                    <g id="Background-Stroke">
                                        <path id="Line-804" d="M7 14L12 9L17 14" stroke="white" stroke-width="2"
                                            stroke-linecap="round" stroke-linejoin="round"></path>
                                    </g>
                                </g>
                            </svg>
                        </span>
                    </span>
                </button>
                <button id='buyDayDown' disabled="" class="NumberInputstyles__IncrementButton-gGByfb guingM">
                    <span style="opacity: 1;" class="styles__SAIcon-ijmsNY fLpDJB">
                        <span>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                                class="injected-svg sa-icon-svg" data-src="/icons/step-down-24.svg"
                                xmlns:xlink="http://www.w3.org/1999/xlink">
                                <g id="General/Step Down">
                                    <g id="Background-Stroke">
                                        <path id="Line-805" d="M17 10L12 15L7 10" stroke="white" stroke-width="2"
                                            stroke-linecap="round" stroke-linejoin="round"></path>
                                    </g>
                                </g>
                            </svg>
                        </span>
                    </span>
                </button>
            </span>
        </span>
    </div>
    `;

        el.parentElement.insertBefore(createElementFromHTML(template, "buyDay"), el.parentElement.firstChild);


        document.getElementById('buyDayUp').onclick = function () {
            var txt = document.getElementById('buyDayTxt');
            var newValue = 0;

            if (!isNaN(txt.value)) {
                newValue = parseInt(txt.value);
            }

            newValue += 1;

            if (newValue <= 365) {
                txt.value = newValue;
                var btnDown = document.getElementById('buyDayDown');
                btnDown.removeAttribute('disabled');
                btnDown.style.pointerEvents = 'all';

                getQtaForDay(newValue);
            }
        }

        document.getElementById('buyDayDown').onclick = function () {
            var txt = document.getElementById('buyDayTxt');
            var newValue = 0;

            if (!isNaN(txt.value)) {
                newValue = parseInt(txt.value);
            }

            newValue -= 1;

            if (newValue >= 0) {
                txt.value = newValue;

                getQtaForDay(newValue);
            }

            if (newValue == 0) {
                var btnDown = document.getElementById('buyDayDown');
                btnDown.setAttribute('disabled', '');
                btnDown.style.pointerEvents = 'none';
            }
        }
    }

}
function getQtaForDay(numDay) {
    var owned = document.querySelector(`div[class^="styles__NumberOwned-"]`);
    var ownedQta = 0.0;
    if (owned.innerText.includes('K')) {
        ownedQta = parseFloat(owned.innerText.split('K')[0]) * 1000;
    } else if (!isNaN(ownedQta.innerText)) {
        ownedQta = parseInt(owned.innerText);
    }

    var dayQta = 0.0;

    for (var x = 0; x < fleetInStaking.length; x++) {
        var shipInfo = cacheShipData.filter(function (el) {
            return el.name == fleetInStaking[x].name;
        });

        if (shipInfo.length == 1) {
            switch (document.getElementsByTagName('h1')[0].innerText.toLowerCase()) {
                case "food":
                    dayQta += fleetInStaking[x].nr * shipInfo[0].fdT;
                    break;
                case "fuel":
                    dayQta += fleetInStaking[x].nr * shipInfo[0].fudT;
                    break;
                case "ammunition":
                    dayQta += fleetInStaking[x].nr * shipInfo[0].adT;
                    break;
                case "toolkit":
                    dayQta += fleetInStaking[x].nr * shipInfo[0].rdT;
                    break;
            }
        }
    }

    var request = dayQta * parseInt(numDay) - ownedQta;

    var el = document.getElementsByTagName('input')[1];
    var nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    nativeInputValueSetter.call(el, (request < 0 ? 0 : request).toFixed(0));

    var ev2 = new Event('input', { bubbles: true });
    el.dispatchEvent(ev2);
}