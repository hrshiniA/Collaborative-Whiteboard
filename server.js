//HTTP CONNECTION
const http = require('http');
const crypto = require('crypto'); 

//generating random 8 bytes and converting to hex string
function generateClientId(){
    const bytes =crypto.randomBytes(8); 
    const hexString = bytes.toString('hex'); 
    return hexString;
}

const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end("WebSocket Server is running")
});

server.listen(8080, () => {
    console.log("Server is listening on port 8080");
});

//WEBSOCKET CONNECTION
const websocket_guid = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
const clients = [];
const previousDrawings = [];
const coloursUsed = [];

server.on('upgrade', (req,socket)=>{
    const websocket_sec_key = req.headers['sec-websocket-key'];  

    const acceptKey  = crypto
    .createHash("sha1")
    .update(websocket_sec_key + websocket_guid)  //encoding
    .digest("base64");

    //server handhake response (changing form http to websocket)
    const headerResponse = [
        "HTTP/1.1 101 Switching Protocols",
        "Upgrade: websocket",
        "Connection: Upgrade",
        `Sec-WebSocket-Accept: ${acceptKey}`,
        "",""
    ]

    socket.write(headerResponse.join("\r\n")); //sending response to client (indicates end of header)
    console.log("websocket connection establsihed");

    clients.push(socket); 

    const clientId = generateClientId(); 
    socket.clientId = clientId; 
    

    const clientColour = generateUniqueColour(); 
    socket.colour = clientColour;

    socket.write(encodeMessage(JSON.stringify({
        type: "clientId",
        clientId,
        colour: clientColour
    })));


    //detecting when client sends a msg, decoding and printing
    socket.on('data', (buffer) =>{
        const msg = decodeMessage(buffer);
        console.log("Message from client:", msg);

        let data;
        //decoding string msg and parsing it to JSON + error handling
        try {
            data = JSON.parse(msg);
        } catch{
            return;
        }

        if (data.type == "draw"){
            const { x, y, brushSize, colour } = data;
            const clientId = socket.clientId; 
            
            previousDrawings.push({ x, y, brushSize, colour, clientId });
            const drawingMsg = JSON.stringify({ type: "draw", x, y, brushSize, colour, clientId,  });

            //broadcasting for user to see others drawings
            for (let i=0;i<clients.length;i++){
                const client = clients[i];
                if (client !== socket && !client.destroyed) { 
                    client.write(encodeMessage(drawingMsg));
                }
            }
        }

        if (data.type === "clear"){
            const clientId = socket.clientId;
            
            for (let i=previousDrawings.length-1;i>=0;i--){
                if(previousDrawings[i].clientId === clientId){
                    previousDrawings.splice(i,1);
                }
            }

            //broadcasting to clear drwaing to all other users
            const clearMsg = JSON.stringify({ type: "clear", clientId });
            for (let i=0;i<clients.length;i++){
                const client = clients[i];
                if (!client.destroyed) {
                    client.write(encodeMessage(clearMsg));
                }
            }

        }

        
    });

    socket.on('close', () => {
        const index = clients.indexOf(socket);
        if (index !== -1){
            clients.splice(index, 1);
        }

        const colorIndex = coloursUsed.indexOf(socket.colour);
        if (colorIndex !== -1) {
            usedColors.splice(colorIndex, 1);
        }
    });
    

    //sending encoded msg to new user
    socket.write(encodeMessage(JSON.stringify({
        type: "previousDrawings",
        history: previousDrawings
    })));

});

function decodeMessage(buffer) {
    const secondByte = buffer[1];
    const length = secondByte & 127;
    const mask = buffer.slice(2, 6);  //masked for security (always 4 bytes)
    const data = buffer.slice(6, 6 + length);
  
    let msg = '';
    for (let i = 0; i < data.length; i++) {  //decoding
      msg += String.fromCharCode(data[i] ^ mask[i % 4]);
    }
    return msg;
}


function encodeMessage(str) {
    const msg = Buffer.from(str);
    const length = msg.length;
    let frame = [];

    frame.push(129); 

    if (length <= 125) {
        frame.push(length);
    } else if (length <= 65535) {
        frame.push(126, (length >> 8) & 255, length & 255);
    } else {
        
        frame.push(
            127,
            0, 0, 0, 0, 
            (length >> 24) & 255,
            (length >> 16) & 255,
            (length >> 8) & 255,
            length & 255
        );
    }

    return Buffer.concat([Buffer.from(frame), msg]);
}

function generateUniqueColour(){
    let colour;

    do {

        const randomValue = Math.random() * 16777215; 
        const hexValue = Math.floor(randomValue).toString(16); 
        const paddedHex = hexValue.padStart(6, "0"); 
        colour = "#" + paddedHex.toUpperCase(); 

    } while (coloursUsed.includes(colour));

    coloursUsed.push(colour); 
    return colour;
}
