const canvas = document.getElementById("whiteboard");
const ctx = canvas.getContext("2d");

let colour = null; 
let brushSize = 5;
let isDrawing = false;
let allDrawings=[];


function startDrawing(event) {
    isDrawing = true;
    keepDrawing(event);
}

function stopDrawing(event) {
    isDrawing = false;
}

function keepDrawing(event){
    if (!clientId || !colour){
        return;
    }

    if (isDrawing) {
        const x = event.offsetX;
        const y = event.offsetY;
        
        draw(x, y, colour, brushSize, false, clientId);
        storeDrawing(x, y, colour, brushSize, clientId);

        const string = JSON.stringify({ type: "draw", x, y, colour, brushSize, clientId });
        websocket.send(string);
    }
}

function draw(x,y,colour,brushSize) {
    
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, Math.PI * 2);
    ctx.fill();
    
}

function storeDrawing(x, y, colour, brushSize, clientId) {
    allDrawings.push({ x, y, colour, brushSize, clientId });
}


function assignRandColour() {
    const hexCharacters = [0,1,2,3,4,5,6,7,8,9,'A','B','C','D','E','F'];
    let colour = '#';
    for (let i = 0; i < 6; i++) {
        colour += hexCharacters[Math.floor(Math.random() * 16)];
    }
    return colour;
}


function redrawBoard(){
    ctx.clearRect(0, 0, canvas.width, canvas.height); 

    for (let i = 0; i < allDrawings.length; i++) {
        const d = allDrawings[i];
        draw(d.x, d.y, d.colour, d.brushSize, true, d.clientId);
    }
}

document.getElementById("clear").addEventListener("click", () =>{
    const clearMsg = JSON.stringify({type:"clear"});
    websocket.send(clearMsg);
})



canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mousemove', keepDrawing);


const websocket = new WebSocket("ws://localhost:8080");  

websocket.onopen = () => {
    console.log("Connection created");
    websocket.send("hello from client");
};



websocket.onclose = () => {
    console.log("Connection closed"); 
    
};

let clientId = null;

//on receival msg from server, run function
websocket.onmessage = (event) => {
    console.log("Message from server:", event.data); 

    const data = JSON.parse(event.data);

    if(data.type === "clientId"){
        clientId = data.clientId;
        colour = data.colour;

        return;
    }

    if (data.type === "previousDrawings") {
        for (let i = 0; i < data.history.length; i++) {
            const drawing = data.history[i];
            draw(drawing.x, drawing.y, drawing.colour, drawing.brushSize, true);
        }
    }
    
    if (data.type === "draw") {
        draw(data.x, data.y, data.colour, data.brushSize);
        storeDrawing(data.x, data.y, data.colour, data.brushSize, data.clientId)
        return;
    }
    
    if (data.type === "clear") {
        for (let i = allDrawings.length - 1; i >= 0; i--) {
            if (allDrawings[i].clientId === data.clientId) {
                allDrawings.splice(i, 1);
            }
        }

        redrawBoard();

        
    }
};