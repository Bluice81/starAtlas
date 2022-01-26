let parser = new DOMParser();
let fleetInStaking = [];
let dateTimeout = new Date();
let animateStar = false;
let getMarketDataApiRunning = false;
let oldUpdateCoinPrice = new Date();
let cvf = 0.0; //current value market usdc lower ask
let cacheShipData;

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
        var el = document.getElementById('divChart');
        if (el.style.display == 'none') {
            el.style.display = 'block';
        } else {
            el.style.display = 'none';
        }
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

    initChartWindow();

    //create extension menu if not exists
    if (!document.getElementById('mnuAtlasTool')) {
        myLog('create extension menu');
        var navMenu = document.querySelectorAll(`div[class^="NavItemstyles__"]`);

        var template = `
            <div id='mnuAtlasTool' style='left: 0px; bottom: -108px; position: absolute; width: 80px;'>
                <div style='display: flex; flex-flow: column'>
                    <div id='mnuSetting' style="width: 100%; background-position: center; background-size: 36px; height: 40px; cursor: pointer; background-image: url('data:image/png;base64,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'); background-repeat: no-repeat">
                    </div> 
                    <div id='divCvf' title='Current value of fleet (click for refresh)' style='letter-spacing: 0.1em; cursor: pointer; user-select: none; margin: auto; font-size: 18px; padding-top: 5px'>
                    </div> 
                    <div id='divTnf' title='Net farm atlas for one day (click for refresh)' style='letter-spacing: 0.1em; cursor: pointer; user-select: none; margin: auto; font-size: 18px; padding-top: 5px'>
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
                        <a style='text-decoration: underline;' target="_blank" href='https://lnk.totemzetasoft.it/starAtlas/guida.html'>v. 3.2 27/01/2022</a>
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
        initBuyResources();

        if (extSetting.ext009 == "YES") {
            //Fix open order visibility
            var el = document.querySelector(`div[class^="styles__ActionButtons-"]`);
            if (el && el.style.margin == '20px') {
                //myLog('fix open orders layout');
                return;
            }

            if (el) {
                el.style.margin = '20px';
            }

            el = document.querySelector(`div[class^="styles__OpenOrdersWrapper-"]`);
            if (el) {
                el.style.overflowy = 'scroll';
                el.style.margin = '0';
                el.style.height = '120px';
            }

            el = document.querySelector(`div[class^="styles__DexOpenOrdersWrapper-"]`);
            if (el) {
                el.style.height = 'max-content';
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
        var fleet = document.querySelectorAll(`p[class^="FleetDashboardItemstyles__FleetName-"]`);
        for (var x = 0; x < fleet.length; x++) {
            var obj = {};
            obj.name = fleet[x].innerText.toLowerCase();
            obj.nr = parseInt(fleet[x].parentElement.parentElement.parentElement.querySelectorAll(`span[class^="ItemDetailDimensionstyles__ItemDetailDimensionValue-"]`)[1].innerText);

            fleetInStaking.push(obj);
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

    retrieveCvf(shipData);

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
            totalFdH += fleetInStaking[x].nr * shipInfo[0].fd * 60 * 24;
            totalFudH += fleetInStaking[x].nr * shipInfo[0].fud * 60 * 24;
            totalAdH += fleetInStaking[x].nr * shipInfo[0].ad * 60 * 24;
            totalRdH += fleetInStaking[x].nr * shipInfo[0].rd * 60 * 24;
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
    retrieveCvf(shipData);

    var data = '';
    var template = `
            <span id="monthlyRewards" style="margin-left: 30px" class="FleetRewardsTextstyles__FleetRewardsTextWrapper-hqStiK hiQUPk">
                <span class="FleetRewardsTextstyles__FleetRewardsLabel-jconmC jTIwjt">Net Monthly Rewards</span>
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
            var elements = fleet[x].closest("div").parentElement.parentElement.querySelectorAll(`div[class^="FleetDashboardItemstyles__FleetRewardsTextWrapper-"]`);

            elements[0].style.display = "flex";
            elements[0].insertBefore(createElementFromHTML(data, "monthlyRewards"), null);
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

function initStar(container) {
    var canvasWidth = container.offsetWidth + 20;
    var canvasHeight = container.offsetHeight + 10;

    var canvas = document.createElement('canvas');
    canvas.setAttribute('width', canvasWidth);
    canvas.setAttribute('height', canvasHeight);
    canvas.style.position = 'absolute';
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.opacity = '0.6';
    canvas.setAttribute('id', 'starCanvas');

    canvas.addEventListener('mousemove', mouseMoveHandler);
    canvas.addEventListener('mouseenter', mouseEnterHandler);
    canvas.addEventListener('mouseleave', mouseLeaveHandler);

    container.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    var imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    var pix = imageData.data;

    var center = { x: canvas.width / 2, y: canvas.height / 2 };

    var mouseActive = false;
    var mousePos = { x: center.x, y: center.y };

    var fov = 300;
    var fovMin = 210;
    var fovMax = fov;

    var starHolderCount = 6666;
    var starHolder = [];
    var starBgHolder = [];
    var starSpeed = 20;
    var starSpeedMin = starSpeed;
    var starSpeedMax = 200;
    var starDistance = 8000;

    var backgroundColor = { r: 0, g: 0, b: 0, a: 0 };

    var colorInvertValue = 0;

    function clearImageData() {

        for (var i = 0, l = pix.length; i < l; i += 4) {

            pix[i] = backgroundColor.r;
            pix[i + 1] = backgroundColor.g;
            pix[i + 2] = backgroundColor.b;
            pix[i + 3] = backgroundColor.a;

        }

    };

    function setPixel(x, y, r, g, b, a) {

        var i = (x + y * canvasWidth) * 4;

        pix[i] = r;
        pix[i + 1] = g;
        pix[i + 2] = b;
        pix[i + 3] = a;

    };

    function setPixelAdditive(x, y, r, g, b, a) {

        var i = (x + y * canvasWidth) * 4;

        pix[i] = pix[i] + r;
        pix[i + 1] = pix[i + 1] + g;
        pix[i + 2] = pix[i + 2] + b;
        pix[i + 3] = a;

    };

    //---

    function drawLine(x1, y1, x2, y2, r, g, b, a) {

        var dx = Math.abs(x2 - x1);
        var dy = Math.abs(y2 - y1);

        var sx = (x1 < x2) ? 1 : -1;
        var sy = (y1 < y2) ? 1 : -1;

        var err = dx - dy;

        var lx = x1;
        var ly = y1;

        while (true) {

            if (lx > 0 && lx < canvasWidth && ly > 0 && ly < canvasHeight) {

                setPixel(lx, ly, r, g, b, a);

            }

            if ((lx === x2) && (ly === y2))
                break;

            var e2 = 2 * err;

            if (e2 > -dx) {

                err -= dy;
                lx += sx;

            }

            if (e2 < dy) {

                err += dx;
                ly += sy;

            }

        }

    };

    //---

    function addParticle(x, y, z, ox, oy, oz) {

        var particle = {};
        particle.x = x;
        particle.y = y;
        particle.z = z;
        particle.ox = ox;
        particle.oy = oy;
        particle.x2d = 0;
        particle.y2d = 0;

        return particle;

    };

    function addParticles() {

        var i;

        var x, y, z;

        var colorValue;
        var particle;

        for (i = 0; i < starHolderCount / 3; i++) {

            x = Math.random() * 24000 - 12000;
            y = Math.random() * 4500 - 2250;
            z = Math.round(Math.random() * starDistance);//Math.random() * 700 - 350;

            colorValue = Math.floor(Math.random() * 55) + 5;

            particle = addParticle(x, y, z, x, y, z);
            particle.color = { r: colorValue, g: colorValue, b: colorValue, a: 255 };

            starBgHolder.push(particle);

        }

        for (i = 0; i < starHolderCount; i++) {

            x = Math.random() * 10000 - 5000;
            y = Math.random() * 10000 - 5000;
            z = Math.round(Math.random() * starDistance);//Math.random() * 700 - 350;

            colorValue = Math.floor(Math.random() * 155) + 100;

            particle = addParticle(x, y, z, x, y, z);
            particle.color = { r: colorValue, g: colorValue, b: colorValue, a: 255 };
            particle.oColor = { r: colorValue, g: colorValue, b: colorValue, a: 255 };
            particle.w = 1;
            particle.distance = starDistance - z;
            particle.distanceTotal = Math.round(starDistance + fov - particle.w);

            starHolder.push(particle);

        }

    };

    //---

    window.requestAnimFrame = (function () {

        return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            function (callback) {
                window.setTimeout(callback, 1000 / 60);
            };

    })();

    function animloop() {
        if (animateStar) {
            requestAnimFrame(animloop);
        }
        render();

    };

    function render() {

        clearImageData();

        //---

        var i, j, l, k, m, n;

        //---

        var rx, rz;

        var star;
        var scale;

        //---

        if (mouseActive) {

            starSpeed += 2;

            if (starSpeed > starSpeedMax)
                starSpeed = starSpeedMax;

        } else {

            starSpeed -= 1;

            if (starSpeed < starSpeedMin)
                starSpeed = starSpeedMin;

        }

        //---

        if (!mouseActive) {
            fov += 0.5;

            if (fov > fovMax)
                fov = fovMax;

        } else {

            fov -= 1;

            if (fov < fovMin)
                fov = fovMin;

        }

        var warpSpeedValue = starSpeed * (starSpeed / (starSpeedMax / 2));

        for (i = 0, l = starBgHolder.length; i < l; i++) {

            star = starBgHolder[i];

            scale = fov / (fov + star.z);

            star.x2d = (star.x * scale) + center.x;
            star.y2d = (star.y * scale) + center.y;

            if (star.x2d > 0 && star.x2d < canvasWidth && star.y2d > 0 && star.y2d < canvasHeight) {

                setPixel(star.x2d | 0, star.y2d | 0, star.color.r, star.color.g, star.color.b, 255);

            }


        }

        //---

        for (i = 0, l = starHolder.length; i < l; i++) {

            star = starHolder[i];

            star.z -= starSpeed;
            star.distance += starSpeed;

            if (star.z < -fov + star.w) {

                star.z = starDistance;
                star.distance = 0;

            }

            //---
            //star color

            var distancePercent = star.distance / star.distanceTotal;

            star.color.r = Math.floor(star.oColor.r * distancePercent);
            star.color.g = Math.floor(star.oColor.g * distancePercent);
            star.color.b = Math.floor(star.oColor.b * distancePercent);

            //---
            //star draw

            scale = fov / (fov + star.z);

            star.x2d = (star.x * scale) + center.x;
            star.y2d = (star.y * scale) + center.y;

            if (star.x2d > 0 && star.x2d < canvasWidth && star.y2d > 0 && star.y2d < canvasHeight) {

                setPixelAdditive(star.x2d | 0, star.y2d | 0, star.color.r, star.color.g, star.color.b, 255);

            }

            if (starSpeed != starSpeedMin) {

                var nz = star.z + warpSpeedValue;

                scale = fov / (fov + nz);

                var x2d = (star.x * scale) + center.x;
                var y2d = (star.y * scale) + center.y;

                if (x2d > 0 && x2d < canvasWidth && y2d > 0 && y2d < canvasHeight) {

                    drawLine(star.x2d | 0, star.y2d | 0, x2d | 0, y2d | 0, star.color.r, star.color.g, star.color.b, 255);

                }

            }

        }

        //---

        ctx.putImageData(imageData, 0, 0);

        //---

        if (mouseActive) {

            center.x += (mousePos.x - center.x) * 0.015;

        } else {

            center.x += ((canvas.width / 2) - center.x) * 0.015;

        }

    };

    //---

    function mouseMoveHandler(event) {

        mousePos = getMousePos(canvas, event);

    };

    function mouseEnterHandler(event) {
        mouseActive = true;
    };

    function mouseLeaveHandler(event) {
        mouseActive = false;
    };
    function getMousePos(canvas, event) {

        var rect = canvas.getBoundingClientRect();

        return { x: event.clientX - rect.left, y: event.clientY - rect.top };

    };

    addParticles();
    animloop();
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
                    <div id='priceAtlas' style='flex: 1 1 auto; height: 30px; background: url("https://lnk.totemzetasoft.it/starAtlas/api/price/star-atlas.png"); background-size:cover; background-repeat: no-repeat; margin-right: 10px'>
                    </div>
                </div>	
                <div style='display: flex; padding-top: 10px'>
                    <div style='text-transform: uppercase; font-size:24px; font-family: tungstenBook; flex: 0 1 auto; height: 30px; width: 100px; display: flex; justify-content: center'>
                        polis
                    </div>
                    <div id='pricePolis' style='flex: 1 1 auto; height: 30px; background: url("https://lnk.totemzetasoft.it/starAtlas/api/price/star-atlas-polis.png"); background-size:cover; background-repeat: no-repeat; margin-right: 10px'>
                    </div>
                </div>	
                <div style='display: flex; padding-top: 10px'>
                    <div style='text-transform: uppercase; font-size:24px; font-family: tungstenBook; flex: 0 1 auto; height: 30px; width: 100px; display: flex; justify-content: center'>
                        solana
                    </div>
                    <div id='priceSolana' style='flex: 1 1 auto; height: 30px; background: url("https://lnk.totemzetasoft.it/starAtlas/api/price/solana.png"); background-size:cover; background-repeat: no-repeat; margin-right: 10px'>
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
    } else if (document.getElementById('divPrice').style.display == 'block') {
        //update price
        if ((new Date() - oldUpdateCoinPrice) / 1000 > 20) {
            myLog('update coin price');

            var tmp = document.getElementById('priceAtlas').style.background;
            document.getElementById('priceAtlas').style.background = tmp.split('.png')[0] + '.png?t=' + getTicks() + tmp.split('.png')[1];

            tmp = document.getElementById('pricePolis').style.background;
            document.getElementById('pricePolis').style.background = tmp.split('.png')[0] + '.png?t=' + getTicks() + tmp.split('.png')[1];

            tmp = document.getElementById('priceSolana').style.background;
            document.getElementById('priceSolana').style.background = tmp.split('.png')[0] + '.png?t=' + getTicks() + tmp.split('.png')[1];

            oldUpdateCoinPrice = new Date;
        }
    }
}
function getTicks() {
    var now = new Date();
    return now.getTime();
}
function initChartWindow() {
    if (!document.getElementById('divChart')) {
        var templateTest = `<iframe style='border:0; position:absolute; top:0; z-index: 1000; display:none; width:100%;height:100%' id='divChart' src="https://lnk.totemzetasoft.it/starAtlas/roi.html"></iframe>`;

        document.body.appendChild(createElementFromHTML(templateTest, 'divChart'), null);
    }
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

    retrieveTnfDay(shipData)
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

    if (!document.getElementById('buyDay') && el && fleetInStaking.length > 0) {
        var template = `
    <div id='buyDay' style="margin-right: 15px;" class="NumberInputstyles__Wrapper-gnPFvn bExyxS NumberInputWrapper">
        <label>For x day</label>
        <span label="size" style="width: 101px" class="NumberInputstyles__InputWrapper-gLvgTt fSjyWd">
            <input id='buyDayTxt' readonly='true' type="number" style="width: 101px" min="0" max="365" value="0">
            <span class="NumberInputstyles__ButtonWrapper-eUHVOh liZuZM">
                <button id='buyDayUp' class="NumberInputstyles__IncrementButton-gGByfb idyQxT">
                    <span style="opacity: 1;" class="styles__SAIcon-ijmsNY fLpDJB">
                        <span>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="injected-svg sa-icon-svg" data-src="/icons/step-up-24.svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                                <g id="General/Step Up">
                                    <g id="Background-Stroke">
                                        <path id="Line-183" d="M7 14L12 9L17 14" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                    </g>
                                </g>
                            </svg>
                        </span>
                    </span>
                </button>
                <button id='buyDayDown' disabled="" class="NumberInputstyles__IncrementButton-gGByfb idwzqS">
                    <span style="opacity: 1;" class="styles__SAIcon-ijmsNY fLpDJB">
                        <span>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="injected-svg sa-icon-svg" data-src="/icons/step-down-24.svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                                <g id="General/Step Down">
                                    <g id="Background-Stroke">
                                        <path id="Line-184" d="M17 10L12 15L7 10" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
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

        getMarketDataApi(0, setCacheShipData);
    }

}
function setCacheShipData(shipData) {
    cacheShipData = shipData;
}
function getQtaForDay(numDay) {
    var owned = document.querySelector(`span[class^="TechButtonstyles__TagText-"]`);
    var ownedQta = owned.innerText.split('K')[0].replace('.', '').replace(',', '');
    if (isNaN(ownedQta)) {
        ownedQta = 0;
    } else {
        ownedQta = parseInt(ownedQta);
    }

    var dayQta = 0.0;

    for (var x = 0; x < fleetInStaking.length; x++) {
        var shipInfo = cacheShipData.filter(function (el) {
            return el.name == fleetInStaking[x].name;
        });

        if (shipInfo.length == 1) {
            switch (document.getElementsByTagName('h1')[0].innerText.toLowerCase()) {
                case "food":
                    dayQta += fleetInStaking[x].nr * shipInfo[0].fd * 60 * 24;
                    break;
                case "fuel":
                    dayQta += fleetInStaking[x].nr * shipInfo[0].fud * 60 * 24;
                    break;
                case "ammunition":
                    dayQta += fleetInStaking[x].nr * shipInfo[0].ad * 60 * 24;
                    break;
                case "toolkit":
                    dayQta += fleetInStaking[x].nr * shipInfo[0].rd * 60 * 24;
                    break;
            }
        }
    }

    var el = document.getElementsByTagName('label')[1];
    var request = dayQta * parseInt(numDay) - ownedQta;

    el.innerText = 'SIZE: ' + (request < 0 ? 0 : request).toFixed(0);
}