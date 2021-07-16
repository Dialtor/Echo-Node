// import websockets and request
var WebSocket = require('ws');
var axios = require('axios');

var started = {};
var finished = {};
var progress_change = {};

module.exports = {
    "version": "1.0.0",
    "API": class {
        constructor(apiKey) {
            this.apiKey = apiKey;
        }

        async getPlayerInfo(player) {
            return (await this.request("GET", "/query/player", {
                "key": this.apiKey,
                "player": player
            })).data.result;
        }

        async getUserInfo() {
            return (await this.request("GET", "/query/me", {
                "key": this.apiKey
            })).data.result;
        }

        async getPinInfo() {
            return (await this.request("GET", "/query/pin", {
                "key": this.apiKey
            })).data.result;
        }

        async refreshPin() {
            return (await this.request("POST", "/update/pin", {
                "key": this.apiKey
            })).data.result;
        }

        async getScans(length, extended, enterprise) {
            return (await this.request("GET", "/query/scans", {
                "key": this.apiKey,
                "length": length,
                "extended": extended,
                "enterprise": enterprise
            })).data.result;
        }

        async getScanInfo(uuid) {
            return (await this.request("GET", "/query/scan", {
                "key": this.apiKey,
                "uuid": uuid
            })).data.result;
        }

        on(pin, event, callback) {
            if (event === "started") {
                started[pin] = callback;
            }

            if (event === "finished") {
                finished[pin] = callback;
            }

            if (event === "progress_change") {
                progress_change[pin] = callback;
            }
        }

        off(pin, event) {
            if (event === "started") {
                delete started[pin];
            }

            if (event === "finished") {
                delete finished[pin];
            }

            if (event === "progress_change") {
                delete progress_change[pin];
            }
        }

        listen(pin) {
            // open a websocket to "wss://scanner.echo.ac" with "progress" protocol, then send the message "<pin>|no|progress"
            let ws = new WebSocket("wss://scanner.echo.ac", "progress");

            ws.onmessage = (event) => {
                var response = event.data;

                if (response === "hello")
                    ws.send(pin + "|no|progress");

                if (response.includes("$")) {
                    var cmd = response.split("$")[0];
                    if (cmd == "NEW_PROGRESS") {
                        var arg = response.split("$")[1];

                        switch (arg) {
                            case "STARTED":
                                if (started[pin]) {
                                    started[pin]();
                                }
                                break;
                            case "FINISHED":
                                if (finished[pin]) {
                                    finished[pin]();
                                }
                                break;
                            default:
                                if (progress_change[pin]) {
                                    progress_change[pin](parseInt(arg));
                                }
                                break;
                        }

                    }
                }

            }
        }

        // request method using axios
        request(method, path, params) {
                        return axios({
                method: method,
                url: "https://api.echo.ac" + path,
                params: params
            });
        }
        
    }
}