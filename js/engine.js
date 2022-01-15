let parser = new DOMParser();
let fleetInStaking = [];
let dateTimeout = new Date();
let shipData;

function myLog(text) {
    console.log('SA_EXT: ' + text);
}

myLog('load extension');
getMarketDataApi(0);

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
    if (location.href.includes('/market/')) {
        //Fix open order visibility
        myLog('current menu: market item');

        var el = document.querySelector(`div[class^="styles__ActionButtons-"]`);
        if (el && el.style.margin == '20px') {
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

    if (location.href.endsWith('/market') || location.href.endsWith('=ship')) {
        myLog('current menu: ships');

        if (!document.getElementById('x01')) {
            processShip();
        }
    }

    if (location.href.includes('/fleet')) {
        myLog('current menu: fleet');

        if (document.getElementsByTagName('canvas').length == 0) {
            myLog('load iperspace effect');
            var container = document.querySelectorAll(`div[class^="FleetDashboardItemstyles__Header"]`);
            for (var x = 0; x < container.length; x++) {
                initStar(container[x]);
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
            myLog('load monthly rewards');
            monthlyRewards();
        }
    }

    if (location.href.includes('/inventory') &&
        document.getElementsByClassName('tabSelected ')[0].innerText.toLowerCase() == 'resources' &&
        !document.getElementById('resourceTimer')) {

        if (fleetInStaking.length == 0) {
            if (!document.getElementById('tabTitle')) {
                var tabTitle = document.querySelector(`h3[class^="TabCardstyles__Title-"]`);
                if (tabTitle) {
                    tabTitle.insertBefore(createElementFromHTML(`<label id='tabTitle' style="display: block; color: white; text-transform: none; font-size: 14px">To view the expected consumption burn, first go to the "Faction Fleet" menu and then come back here.</label>`, 'tabTitle'), null);
                }
            }
        } else {
            checkResourceConsuming();
        }
    }
}

function processShip() {
    myLog('process data ship');

    var elements = document.querySelectorAll('h3[class^="poster__PosterCountLarge-"]');
    for (var x = 0; x < elements.length; x++) {
        var shipInfo = shipData.filter(function (el) {
            return el.name == elements[x].innerText.toLocaleLowerCase();
        });

        if (shipInfo.length == 1) {
            elements[x].insertBefore(createElementFromHTML(`<span id='x01' style="font-family: Graphik; font-style: normal; font-weight: normal; font-size: 12px; line-height: 16px; text-align: center; text-transform: uppercase; color: rgb(146, 146, 150);">vwap: ${formatterUSD.format(shipInfo[0].price)}<br>earn: ${formatterNr.format(shipInfo[0].rgl)} &#916;/day<br>cost: ${formatterNr.format(shipInfo[0].cg)} &#916;/day</span>`, "x01"), null);
        }
    }
}
function checkResourceConsuming() {
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
    var resourcesQta = document.querySelectorAll(`p[class^="generic__StatValue-"]`);
    var totalFdH = 0;
    var totalFudH = 0;
    var totalAdH = 0;
    var totalRdH = 0;
    var vDay = 0;
    var vHour = 0;
    var vValue = 0.0;

    //Calculate hour consuming
    for (var x = 0; x < fleetInStaking.length; x++) {
        var shipInfo = shipData.filter(function (el) {
            return el.name == fleetInStaking[x].name;
        });

        if (shipInfo.length == 1) {
            totalFdH += fleetInStaking[x].nr * shipInfo[0].fd * 60;
            totalFudH += fleetInStaking[x].nr * shipInfo[0].fud * 60;
            totalAdH += fleetInStaking[x].nr * shipInfo[0].ad * 60;
            totalRdH += fleetInStaking[x].nr * shipInfo[0].rd * 60;
        }
    }

    for (var x = 0; x < resources.length; x++) {
        switch (resources[x].innerText.toLocaleLowerCase()) {
            case "fuel":
                vValue = parseFloat(resourcesQta[0].innerText.split(" ")[0]) / (parseFloat(totalFudH) * 24.0);
                break;
            case "food":
                vValue = parseFloat(resourcesQta[1].innerText.split(" ")[0]) / (totalFdH * 24.0);
                break;
            case "ammunition":
                vValue = parseFloat(resourcesQta[2].innerText.split(" ")[0]) / (totalAdH * 24.0);
                break;
            case "toolkit":
                vValue = parseFloat(resourcesQta[3].innerText.split(" ")[0]) / (totalRdH * 24.0);
                break;
        }

        vDay = Math.trunc(vValue);
        vHour = Math.trunc((vValue - vDay) * 24);
        var data = templateTimer.replace('??D', vDay + 'D');
        data = data.replace('??H', ('00' + vHour).slice(-2) + 'H');

        resources[x].insertBefore(createElementFromHTML(data, 'resourceTimer'), null);
    }
}
function monthlyRewards() {
    var data = '';
    var template = `
            <span id="monthlyRewards" style="margin-left: 30px" class="FleetRewardsTextstyles__FleetRewardsTextWrapper-hqStiK hiQUPk">
                <span class="FleetRewardsTextstyles__FleetRewardsLabel-jconmC jTIwjt">Monthly Rewards</span>
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

function getMarketDataApi(type) {
    callApi({ "action": "getMarketData", "type": type })
        .then(data => {
            shipData = data;
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

    canvas.oncontextmenu = function (e) {
        e.preventDefault();
    };

    canvas.addEventListener('mousemove', mouseMoveHandler);
    canvas.addEventListener('mousedown', mouseDownHandler);
    canvas.addEventListener('mouseup', mouseUpHandler);
    canvas.addEventListener('mouseenter', mouseEnterHandler);
    canvas.addEventListener('mouseleave', mouseLeaveHandler);

    container.appendChild(canvas);

    //---

    var ctx = canvas.getContext('2d');
    var imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    var pix = imageData.data;

    //---

    var MATHPI180 = Math.PI / 180;
    var MATHPI2 = Math.PI * 2;

    var center = { x: canvas.width / 2, y: canvas.height / 2 };

    //---

    var mouseActive = false;
    var mouseDown = false;
    var mousePos = { x: center.x, y: center.y };

    //---

    var rotationSpeed = -1.00;
    var rotationSpeedFactor = { x: 0, y: 0 };
    rotationSpeedFactor.x = rotationSpeed / center.x;
    rotationSpeedFactor.y = rotationSpeed / center.y;

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
    var starRotation = 0;

    var backgroundColor = { r: 0, g: 0, b: 0, a: 0 };

    var colorInvertValue = 0;

    //---

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

        requestAnimFrame(animloop);
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

            if (mouseDown) {

                //rotation
                var radians = MATHPI180 * starRotation;

                var cos = Math.cos(radians);
                var sin = Math.sin(radians);

                star.x = (cos * (star.ox - center.x)) + (sin * (star.oy - center.y)) + center.x,
                    star.y = (cos * (star.oy - center.y)) - (sin * (star.ox - center.x)) + center.y;

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

        //---

        if (mouseDown) {

            starRotation -= 0.5;

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

        mouseDown = false;

    };

    function mouseDownHandler(event) {

        mouseDown = true;

        speed = 0;

    };

    function mouseUpHandler(event) {

        mouseDown = false;

        speed = 0.25;

    };

    //---

    function getMousePos(canvas, event) {

        var rect = canvas.getBoundingClientRect();

        return { x: event.clientX - rect.left, y: event.clientY - rect.top };

    };

    //---

    function touchStartHandler(event) {

        event.preventDefault();

        mouseDown = true;
        mouseActive = true;

    };

    function touchEndHandler(event) {

        event.preventDefault();

        mouseDown = false;
        mouseActive = false;

    };

    function touchMoveHandler(event) {

        event.preventDefault();

        mousePos = getTouchPos(canvas, event);

    };

    function touchCancelHandler(event) {

        mouseDown = false;
        mouseActive = false;

    };

    //---

    function getTouchPos(canvas, event) {

        var rect = canvas.getBoundingClientRect();

        return { x: event.touches[0].clientX - rect.left, y: event.touches[0].clientY - rect.top };

    };

    //---

    addParticles();
    animloop();

}