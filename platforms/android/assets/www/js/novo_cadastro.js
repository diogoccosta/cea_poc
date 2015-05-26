var SMPIntegration = (function() {
    var config = {
        appId: "com.coolappz.cordova",
        applicationContext: null,
        smpServerProtocol: "http",
        smpServerHost: "172.25.215.199",
        //smpServerHost: "172.16.238.147",
        smpServerPort: "8080",
//        integrationGatewayUrl: "http://172.16.238.148:8080/gateway/odata/SAP/POC;v=1",
        authStr: "",
        startTime: null,
        startTimeRefresh: null,
        online: navigator.onLine,
        timerID: null,
        csrfToken: "",
        idTotal: 0
    };

    window.onerror = onError;

    // Optional initial connection context
    var context = {
        "serverHost": config.smpServerHost, //Place your SMP 3.0 server name here
        "https": config.smpServerProtocol == "https",
        "serverPort": config.smpServerPort,
        "user": "smpAdmin", //user name for registration and the OData Endpoint
        "password": "s3pAdmin", //password for registration and the OData Endpoint
        //once set can be changed by calling sap.Logon.changePassword()
        "communicatorId": "REST",
        "passcode": "password", //note hardcoding passwords and unlock passcodes are strictly for ease of use during development
        //once set can be changed by calling sap.Logon.managePasscode()
        "unlockPasscode": "password",
        "passcode_CONFIRM": "password",
        "ssoPasscode": "Password1"
    };

    var onError = function(msg, url, line) {
        var idx = url.lastIndexOf("/");
        var file = "unknown";
        if (idx > -1) {
            file = url.substring(idx + 1);
        }
        alert("An error occurred in " + file + " (at line # " + line + "): " + msg);
        return false; //suppressErrorAlert;
    };

    var init = function() {
        console.log("DEVICEREADY");
        if (sap.Logger) {
            sap.Logger.setLogLevel(sap.Logger.DEBUG); //enables the display of debug log messages from the Kapsel plugins.
            sap.Logger.debug("Log level set to DEBUG");
        }

        sap.Logon.init(logonSuccessCallback, logonErrorCallback, config.appId, context);
        console.log("init completed");
    };

    var logonSuccessCallback = function(result) {
        console.log("STORE UNLOCKED");
        console.log("logonSuccessCallback " + JSON.stringify(result));
        config.applicationContext = result;
        console.log(result);
        config.authStr = "Basic " + btoa(config.applicationContext.registrationContext.user + ":" + config.applicationContext.registrationContext.password);
        openStore();
    };

    var logonErrorCallback = function(error) {
        console.log("An error occurred:  " + JSON.stringify(error));
        if (device.platform == "Android") { //Not supported on iOS
            navigator.app.exitApp();
        }
    };

    var read = function() {
        updateStatus2("read request started");
        config.startTime = new Date();

        //clearTable();
        var sURL = config.applicationContext.applicationEndpointURL + "/USERS";
        //var sURL = config.integrationGatewayUrl + "/USERS";
        var oHeaders = {};
        //The appcid header is handled by the Logon plugin
        oHeaders['Authorization'] = config.authStr;
        oHeaders['X-SMP-APPCID']  = config.applicationContext.applicationConnectionId;
        oHeaders['X-CSRF-Token']  = 'FETCH';  
        
        var request = {
            headers: oHeaders,
            requestUri: sURL,
            method: "GET"
        };
        console.log(request);
        console.log("read using " + sURL);
        OData.read(request, readSuccessCallback, errorCallback);
    };

    var readSuccessCallback = function(data, response) {
        var endTime = new Date();
        var duration = (endTime - config.startTime) / 1000;
        updateStatus2("Read " + data.results.length + " records in " + duration + " seconds");
        console.log(data);
        console.log(response);
        if(data.results.length) {
          config.idTotal = data.results.length;
          config.csrfToken = response.headers['X-CSRF-Token'];
        }
        

        //var productsTable = document.getElementById("ProductsTable");
        for (var i = 0; i < data.results.length; i++) {
            // var row = productsTable.insertRow(1);
            // var cell1 = row.insertCell(0);
            // var cell2 = row.insertCell(1);
            // var cell3 = row.insertCell(2);
            // cell1.innerHTML = data.results[i].Name;
            // cell2.innerHTML = data.results[i].Description;
            // cell3.innerHTML = data.results[i].Price;
        }
    };

    var errorCallback = function(e) {
        alert("An error occurred: " + JSON.stringify(e));
    };

    var openStore = function() {
        config.startTime = new Date();
        updateStatus2("store.open called");
        var properties = {
            "name": "ProductsOfflineStore",
            "host": config.applicationContext.registrationContext.serverHost,
            "port": config.applicationContext.registrationContext.serverPort,
            "https": config.applicationContext.registrationContext.https,
            "serviceRoot": config.appId,

            //There is a cookie store for JavaScript which is different from the Java one used by the Offline plugin
            "streamParams": "custom_header=Authorization:" + config.authStr + ";",

            //required on iOS if device or simulator uses a proxy to reach the server prior to SMP 3.0 SDK SP05 PL03
            //"streamParams" : "custom_header=Authorization:" + authStr + ";custom_header=X-SMP-APPCID:" +  applicationContext.applicationConnectionId + ";proxy_host=proxy;proxy_port=8080;",
    
            "definingRequests": {
                "UsersDR": "/USERS"
            }
        };

        store = sap.OData.createOfflineStore(properties);
        store.onrequesterror = errorCallback; //called for each modification error during flush

        //var options = {};
        store.open(openStoreSuccessCallback, errorCallback /*, options*/ );
    };


    var openStoreSuccessCallback = function() {
        var endTime = new Date();
        var duration = (endTime - config.startTime) / 1000;
        updateStatus2("Store opened in  " + duration + " seconds");
        sap.OData.applyHttpClient();
        read();
        //refreshStore();
        //refreshOnInterval();
    };

    var refreshOnInterval = function() {
        var interval = 300000; //5 minutes
        config.timerID = setInterval(function() {
            refreshStore();
        }, interval); //call refreshStore every interval,
        //remove timer in pause event, add back in resume
    };

    //After calling this the store will receive any changes from the OData producer.
    var refreshStore = function() {
        console.log("REFRESHSTORE");
        if (!store) {
            updateStatus2("The store must be open before it can be refreshed");
            return;
        }
        if (isDeviceOnline()) {
            config.startTimeRefresh = new Date();
            updateStatus2("store.refresh called");
            store.refresh(refreshStoreCallback, errorCallback);
        }
    };

    var refreshStoreCallback = function() {
        var endTime = new Date();
        var duration = (endTime - config.startTimeRefresh) / 1000;
        updateStatus2("Store refreshed in  " + duration + " seconds");
        
    };

    var getDeviceStatusString = function() {
        if (config.online) {
            return "Device is ONLINE";
        } else {
            return "Device is OFFLINE";
        }
    };

    var isDeviceOnline = function() {
        return config.online;
    };

    var updateStatus1 = function(msg) {
        console.log(msg + " " + getDeviceStatusString());
    };

    var updateStatus2 = function(msg) {
        var addZero = function(input) {
            if (input < 10) {
                return "0" + input;
            }
            return input;
        };
        var d = new Date();
        console.log(msg + " at " + addZero(d.getHours()) + ":" + addZero(d.getMinutes()) + "." + addZero(d.getSeconds()));
    };

    var createSuccess = function() {
      console.log("flushing");
       // store.flush(function(args){
       //   console.log("flushed");
       //   console.log(args);
       //   read();
       // },errorCallback);
        read();

    };

    var loginSuccess = function(data,response) {
        window.location.href = "menu.html";
        console.log("logado!!");
    };

    return {
        init: function() {
            init();
        },
        deviceOnline: function() {
            config.online = true;
            sap.OData.removeHttpClient();
            updateStatus1("");
            console.log("ONLINE!!");
        },
        deviceOffline: function() {
            config.online = false;
            sap.OData.applyHttpClient();
            updateStatus1("Using Offline Store.");
            console.log("OFFLINE!!");
        },
        onPause: function() {
            console.log("PAUSED");
            clearInterval(config.timerID);

        },
        onResume: function() {
            console.log("RESUMED");
            refreshOnInterval();
        },
        
        read: function() {
            return read;
        },
        errorCallback: function() {
            return errorCallback;
        },
        handleSaveButton: function() {
          //  var birthdate = document.getElementById("ano-nasc").value + '-' +
          //     document.getElementById("mes-nasc").value + '-' +
          //     document.getElementById("dia-nasc").value +
          //     'T00:00:00-03:00';
            var newUser = {
                ID: config.idTotal++, 
                USERNAME: document.getElementById("user").value,
                EMAIL: document.getElementById("email").value,
                //BIRTHDATE: new Date(Date.parse(birthdate)),
                //BIRTHDATE: "\/Date(946692000000)\/",
                PASSWORD: document.getElementById("pass").value
            };

            var oHeaders = {
                Authorization: config.authStr//,
               // 'X-SMP-APPCID': config.applicationContext.applicationConnectionId,
               // 'X-CSRF-Token': config.csrfToken
            };

            var request = {
                headers: oHeaders,
                //requestUri: config.integrationGatewayUrl + '/USERS',
                requestUri: config.applicationContext.applicationEndpointURL + '/USERS',
                method: "POST",
                data: newUser
            };
            OData.request(request, createSuccess, errorCallback);
            console.log(newUser);
        },

        login: function() {
            var username = document.getElementById("user_field").value;
            var password = document.getElementById("password_field").value;
            var oHeaders = {
                Authorization: config.authStr
            };

            var url = "/USERS?$filter=USERNAME eq '"+username+"' and PASSWORD eq '" + password + "'";
            var request = {
              headers: oHeaders,
                requestUri: config.applicationContext.applicationEndpointURL + url,
                method: "GET"
            };
            OData.request(request,loginSuccess,errorCallback);
        }
    };
})();