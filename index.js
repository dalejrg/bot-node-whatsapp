const { Client } = require("whatsapp-web.js");
const client = new Client();
const qrcode = require("qrcode-terminal");
const mysql = require("mysql");

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Password.",
  database: "whatsapp_info",
});

async function run() {
  client.on("qr", (qr) => {
    qrcode.generate(qr, { small: true });
  });

  client.on("ready", () => {
    console.log("La conexión a Whatsapp ha sido exitosa.");
  });

  await client.initialize();

  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  client.on("message", async (msg) => {
    if ((msg.body === "hola" || msg.body === 'Hola') && msg.from.endsWith("@c.us")) {
      const chat = await msg.getChat();
      chat.sendStateTyping();
      await delay(3000);

      const menuText = "Menú 🗒️\nSeleccione una opción:\n1. Saludar\n2. Consultar información";
      await client.sendMessage(msg.from, menuText);
    } else if (msg.body === "1" && msg.from.endsWith("@c.us")) {
      const chat = await msg.getChat();
      chat.sendStateTyping();
      await delay(3000);

      const saludo = saludarCliente();
      await client.sendMessage(msg.from, saludo);
    } else if (msg.body === "2" && msg.from.endsWith("@c.us")) {
      const chat = await msg.getChat();
      chat.sendStateTyping();
      await delay(3000);

      await client.sendMessage(msg.from, "Por favor, proporcione su cédula, id o número de registro:");

      const responseMsg = await waitForResponse();
      const userInput = responseMsg.body.trim();

      connection.query(
        `SELECT * FROM clientes WHERE id_cliente = '${userInput}'`, 
        (error, results, fields) => {
          if (error) {
            console.error(error);
            return;
          }

          if (results.length > 0) {
            const cliente = results[0];
            const respuesta = `La información asociada al documento es:\nCedula: ${cliente.id_cliente}\nNombre: ${cliente.nombre}\nApellido: ${cliente.apellido}\nCiudad: ${cliente.ciudad}\nEdad: ${cliente.edad}`;
            client.sendMessage(msg.from, respuesta);
          } else {
            client.sendMessage(msg.from, "No se encontró información para el documento proporcionado.");
          }
        }
      );
    }
  });

  function saludarCliente() {
    const dataActual = new Date();
    const hora = dataActual.getHours();

    let saludo;

    if (hora >= 6 && hora < 12) {
      saludo = "Hola, buenos días 🌞";
    } else if (hora >= 12 && hora < 18) {
      saludo = "Hola, buenas tardes ⛅";
    } else {
      saludo = "Hola, buenas noches 🌛";
    }

    return saludo;
  }

  function waitForResponse() {
    return new Promise((resolve, reject) => {
      client.on("message", async (msg) => {
        if (msg.from.endsWith("@c.us")) {
          resolve(msg);
        }
      });
    });
  }

  client.on("disconnected", () => {
    connection.end();
    console.log("WhatsApp desconectado.");
  });
}

run().catch((err) => console.error(err));
