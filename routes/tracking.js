//const Parse = require('parse/node');
const express = require("express");
const router = express.Router();
const request = require("request");
const inturl =''+process.env.PARSE_SERVER_URL+'';
const PARSEURL = (inturl.includes('https://'))?(inturl.endsWith('/'))?inturl:inturl+'/':(inturl.endsWith('/'))?'https://'+inturl:'https://'+inturl+'/';

console.log("URL del servidor parse: "+PARSEURL);

function  doRequest(surls,start) {
    //console.log("start: "+start);
    //console.log("urls: "+surls);
    urls='';
    if(start != 0){
        urls = surls + '&&skip='+start+ '';
    }else{
        urls = surls;
    }
    return new Promise(function (resolve, reject) {
        request({
            url: urls,
            headers: {
                'X-Parse-Application-Id': ''+process.env.PARSE_SERVER_APLICATION_ID+'',
                'X-Parse-Master-Key': ''+process.env.PARSE_SERVER_MASTER_KEY+''
            }
        }, async function (error, res, body) {
            if (!error && res.statusCode == 200) {
                resul = JSON.parse(body);
                data = resul.results;
                //console.log("data ")
                if(resul.results.length == 1000){
                   datos= await doRequest(surls,start+1000);
                   data = data.concat(datos);
                }
                resolve(data);
            } else {
                reject(error);
            }
        });
    });
}


router.get("/tracking/mostrar", async (req, res) => {
    const users = await doRequest(PARSEURL +'classes/_User?limit=1000',0);
    const defuser= [];
    const defrastreador= [];
    users.forEach(element => {
       if(element.role === 'Usuario'){
              defuser.push(element.username);
       } else{
           defrastreador.push(element.username);
       }
    });
    
    res.render("tracking/mostrar.hbs",{
        defrastreador,
        defuser
    });
});

router.get("/tracking/mapa", async (req, res) => {
        const users = await doRequest( PARSEURL+'classes/_User?limit=1000',0);
    const defuser= [];
    const defrastreador= [];
    users.forEach(element => {
       if(element.role === 'Usuario'){
              defuser.push(element.username);
       } else{
           defrastreador.push(element.username);
       }
    });
    
   res.render("tracking/mapa.hbs",{
    defrastreador,
    defuser    
   }); 
});


router.post("/tracking/mapa", async (req, res) => {
    const errors = [];
    try {

    const { formulariorastreadordatalistOptions, formulariousuariosdatalistOptions, datetimes } = req.body;
    //console.log("datetimes: " + datetimes);
    var fechas=datetimes.split(" a");
    fechas[0]=fechas[0] + ".000Z";
    fechas[1]=fechas[1] + ".000Z";
    fechas[1]=fechas[1].replace(" ","");

    //console.log("fechas: " + fechas);
    console.log("formulariorastreadordatalistOptions: " + formulariorastreadordatalistOptions);
    console.log("formulariousuariosdatalistOptions: " + formulariousuariosdatalistOptions);


    const users = await doRequest(PARSEURL+'classes/_User?limit=1000',0);
    const resultdatosusuario = await doRequest( PARSEURL + 'classes/DatosUsuarios?include=user&&limit=1000',0);

    
    const urlbase= PARSEURL + 'classes/Rastreo?include=Rastreador&&include=UbicacionUsuario&&include=UbicacionRastreador&&limit=1000';
    var concat= '';
    if(formulariorastreadordatalistOptions === '' && formulariousuariosdatalistOptions === ''){
        //ambos vacios
        concat ='&&where={"$and":[{"Fecha":{"$gte":{"__type":"Date","iso":"' + fechas[0] + '"}} },{ "Fecha":{"$lte":{"__type":"Date","iso":"' + fechas[1] +'"}}}]}';
    }else{
        if (formulariousuariosdatalistOptions === '') {
            // usuario vacio rastreador no vacio
            concat='&&where={"$and":[{"$and":[{"Fecha":{"$gte":{"__type":"Date","iso":"' + fechas[0] + '"}}},{ "Fecha":{"$lte":{"__type":"Date","iso":"' + fechas[1] +'"}}}]},{"Rastreador":{"$inQuery": {"where":{"username":"'+ formulariorastreadordatalistOptions+'"},"className":"_User"}}}]}';
        } else {
            // usuario no vacio 
            const userid=[];
            for(userss of resultdatosusuario){
                if(formulariousuariosdatalistOptions === userss.user.username){
                    userid.push(userss.UserID);
                    break;
                }
            }
            if (formulariorastreadordatalistOptions === '' ) {
                // rastreador vacio usuario no vacio
                concat='&&where={"$and":[{"$and":[{"Fecha":{"$gte":{"__type":"Date","iso":"' + fechas[0] + '"}}},{ "Fecha":{"$lte":{"__type":"Date","iso":"' + fechas[1] +'"}}}]},{"idUsuario":"'+ userid+'"}]}'
            } else {
                // ambos no vacios
                concat='&&where={"$and":[{"$and":[{"Fecha":{"$gte":{"__type":"Date","iso":"' + fechas[0] + '"}}},{ "Fecha":{"$lte":{"__type":"Date","iso":"' + fechas[1] +'"}}}]},{"$and":[{"Rastreador":{"$inQuery": {"where":{"username":"'+ formulariorastreadordatalistOptions+'"},"className":"_User"}}}]},{"idUsuario":"'+ userid+'"}]}'
            }
        }
    }
    //console.log("concat: " + concat);
    const urluserrastreadorfecha='&&';
    const urllll =urlbase + concat;
    //console.log("urllll: " +urllll);
    const result = await doRequest(urllll,0);
    
    
    //console.log("resultado " + result);
    //console.log("resultadousuario " + resultdatosusuario);
    var dataLocations =[];
    for (const element of result) {  
        let user = [];
        for (user2 of resultdatosusuario) {
            if(user2.UserID === element.idUsuario){
                user.push(user2);
                break;
            };
        }
        var row = [];
        row.push(element.Fecha.iso);
        row.push(element.Rastreador.username);
        var UbicacionRastreador = [];
        if (element.UbicacionRastreador !== undefined) {
   
            UbicacionRastreador.push(element.UbicacionRastreador.Longitud);
            UbicacionRastreador.push(element.UbicacionRastreador.Latitude);
            UbicacionRastreador.push(element.UbicacionRastreador.Altitude);
            UbicacionRastreador.push(element.UbicacionRastreador.Bearing);
            UbicacionRastreador.push(element.UbicacionRastreador.Speed);
        } 
        row.push(UbicacionRastreador)
        row.push(user[0].user.username);
        var UbicacionUsuario = [];
        if (element.UbicacionUsuario !== undefined) {
            UbicacionUsuario.push(element.UbicacionUsuario.Longitud);
            UbicacionUsuario.push(element.UbicacionUsuario.Latitude);
            UbicacionUsuario.push(element.UbicacionUsuario.Altitude);
            UbicacionUsuario.push(element.UbicacionUsuario.Bearing);
            UbicacionUsuario.push(element.UbicacionUsuario.Speed);
        } 
        row.push(UbicacionUsuario)
        row.push(element.DistanciaBeacon);
        row.push(element.objectId);
        dataLocations.push(row);
    };
    
    const defuser= [];
    const defrastreador= [];
    users.forEach(element => {
       if(element.role === 'Usuario'){
              defuser.push(element.username);
       } else{
           defrastreador.push(element.username);
       }
    });
    //console.log("dataLocations " + dataLocations);  

    
    res.render("tracking/mapa.hbs", {
        errors,
        formulariorastreadordatalistOptions,
        formulariousuariosdatalistOptions,
        datetimes,
        dataLocations,
        defrastreador,
        defuser
    });
    } catch (error) {
        errors.push(error);        
        res.render("tracking/mapa.hbs", {
            errors,
        });
    }
});

router.post("/tracking/mostrar", async (req, res) => {
    const errors = [];
    try {
    const { formulariorastreadordatalistOptions, formulariousuariosdatalistOptions, datetimes } = req.body;
    //console.log("datetimes: " + datetimes);
    var fechas=datetimes.split(" a");
    fechas[0]=fechas[0] + ".000Z";
    fechas[1]=fechas[1] + ".000Z";
    fechas[1]=fechas[1].replace(" ","");

    //console.log("fechas: " + fechas);
    console.log("formulariorastreadordatalistOptions: " + formulariorastreadordatalistOptions);
    console.log("formulariousuariosdatalistOptions: " + formulariousuariosdatalistOptions);


    const users = await doRequest('https://app.ed0cyawkrad.duckdns.org/parse/classes/_User?limit=1000',0);
    const resultdatosusuario = await doRequest('https://app.ed0cyawkrad.duckdns.org/parse/classes/DatosUsuarios?include=user&&limit=1000',0);

    
    const urlbase='https://app.ed0cyawkrad.duckdns.org/parse/classes/Rastreo?include=Rastreador&&include=UbicacionUsuario&&include=UbicacionRastreador&&limit=1000';
    var concat= '';
    if(formulariorastreadordatalistOptions === '' && formulariousuariosdatalistOptions === ''){
        //ambos vacios
        concat ='&&where={"$and":[{"Fecha":{"$gte":{"__type":"Date","iso":"' + fechas[0] + '"}} },{ "Fecha":{"$lte":{"__type":"Date","iso":"' + fechas[1] +'"}}}]}';
    }else{
        if (formulariousuariosdatalistOptions === '') {
            // usuario vacio rastreador no vacio
            concat='&&where={"$and":[{"$and":[{"Fecha":{"$gte":{"__type":"Date","iso":"' + fechas[0] + '"}}},{ "Fecha":{"$lte":{"__type":"Date","iso":"' + fechas[1] +'"}}}]},{"Rastreador":{"$inQuery": {"where":{"username":"'+ formulariorastreadordatalistOptions+'"},"className":"_User"}}}]}';
        } else {
            // usuario no vacio 
            const userid=[];
            for(userss of resultdatosusuario){
                if(formulariousuariosdatalistOptions === userss.user.username){
                    userid.push(userss.UserID);
                    break;
                }
            }
            if (formulariorastreadordatalistOptions === '' ) {
                // rastreador vacio usuario no vacio
                concat='&&where={"$and":[{"$and":[{"Fecha":{"$gte":{"__type":"Date","iso":"' + fechas[0] + '"}}},{ "Fecha":{"$lte":{"__type":"Date","iso":"' + fechas[1] +'"}}}]},{"idUsuario":"'+ userid+'"}]}'
            } else {
                // ambos no vacios
                concat='&&where={"$and":[{"$and":[{"Fecha":{"$gte":{"__type":"Date","iso":"' + fechas[0] + '"}}},{ "Fecha":{"$lte":{"__type":"Date","iso":"' + fechas[1] +'"}}}]},{"$and":[{"Rastreador":{"$inQuery": {"where":{"username":"'+ formulariorastreadordatalistOptions+'"},"className":"_User"}}}]},{"idUsuario":"'+ userid+'"}]}'
            }
        }
    }
    //console.log("concat: " + concat);
    const urluserrastreadorfecha='&&';
    const urllll =urlbase + concat;
    //console.log("urllll: " +urllll);
    const result = await doRequest(urllll,0);
    
    
    //console.log("resultado " + result);
    //console.log("resultadousuario " + resultdatosusuario);
    var dataSet =[];
    for (const element of result) {  
        //const resultadoUbicacionRastreador = await doRequest('https://app.ed0cyawkrad.duckdns.org/parse/classes/Ubicacion?where={"objectId":"' + element.UbicacionRastreador.objectId + '"}',0);
        //const resultadoUbicacionUsuario = await doRequest('https://app.ed0cyawkrad.duckdns.org/parse/classes/Ubicacion?where={"objectId":"' + element.UbicacionUsuario.objectId + '"}',0);
        //console.log("resultadoUbicacionRastreador " + resultadoUbicacionRastreador);
        //console.log("resultadoUbicacionUsuario " + resultadoUbicacionUsuario);
        let user = [];
        for (user2 of resultdatosusuario) {
            if(user2.UserID === element.idUsuario){
                user.push(user2);
                break;
            };
        }
        var row = [];
        //console.log("Fecha: " + element.Fecha.iso);
        row.push(element.Fecha.iso);
        //console.log("Rastreador: " + element.Rastreador.objectId);
        row.push(element.Rastreador.username);
        if (element.UbicacionRastreador != undefined ) {
            //console.log("UbicacionRastreador: Latitud: " + resultadoUbicacionRastreador[0].Latitude + " Longitud: " + resultadoUbicacionRastreador[0].Longitud + " Altitud: " + resultadoUbicacionRastreador[0].Altitude + " Bearing: " + resultadoUbicacionRastreador[0].Bearing + " Speed: " + resultadoUbicacionRastreador[0].Speed);
            row.push("Latitud: " + element.UbicacionRastreador.Latitude + " Longitud: " + element.UbicacionRastreador.Longitud + " Altitud: " + element.UbicacionRastreador.Altitude + " Bearing: " + element.UbicacionRastreador.Bearing + " Speed: " + element.UbicacionRastreador.Speed);

        } else {
            //console.log("UbicacionRastreador: ");
            row.push("UbicacionRastreador: ");
        }
        //console.log("Usuario: " + user[0].user.username);
        row.push(user[0].user.username);
        if (element.UbicacionUsuario !== undefined) {
            //console.log("UbicacionUsuario: Latitud: " + resultadoUbicacionUsuario[0].Latitude + " Longitud: " + resultadoUbicacionUsuario[0].Longitud + " Altitud: " + resultadoUbicacionUsuario[0].Altitude + " Bearing: " + resultadoUbicacionUsuario[0].Bearing + " Speed: " + resultadoUbicacionUsuario[0].Speed);
            row.push("Latitud: " + element.UbicacionUsuario.Latitude + " Longitud: " + element.UbicacionUsuario.Longitud + " Altitud: " + element.UbicacionUsuario.Altitude + " Bearing: " + element.UbicacionUsuario.Bearing + " Speed: " + element.UbicacionUsuario.Speed);
            //console.log("UbicacionUsuario: Latitud: " + element.UbicacionUsuario.Latitude + " Longitud: " + element.UbicacionUsuario.Longitud + " Altitud: " + element.UbicacionUsuario.Altitude + " Bearing: " + element.UbicacionUsuario.Bearing + " Speed: " + element.UbicacionUsuario.Speed);
        } else {
            //console.log("UbicacionUsuario: ");
            row.push("UbicacionUsuario: ");
        }
        //console.log("Distancia: " + element.DistanciaBeacon);
        row.push(element.DistanciaBeacon);
        dataSet.push(row);
    };
    
    const defuser= [];
    const defrastreador= [];
    users.forEach(element => {
       if(element.role === 'Usuario'){
              defuser.push(element.username);
       } else{
           defrastreador.push(element.username);
       }
    });
    console.log("render " );
    res.render("tracking/mostrar.hbs", {
        errors,
        formulariorastreadordatalistOptions,
        formulariousuariosdatalistOptions,
        datetimes,
        dataSet,
        defrastreador,
        defuser
    });
    } catch (error) {
        errors.push(error);        
        res.render("tracking/mostrar.hbs", {
            errors,
        });
    }
});


module.exports = router;