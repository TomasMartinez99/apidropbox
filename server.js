const express = require('express');
const axios = require('axios');
const multer = require('multer');
const app = express();
const port = 3000;

// Configura la aplicación Express
app.use(express.static('public'));

const path = require('path');

// Configura la ubicación donde se guardarán los archivos subidos y sus nombres
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const rutaAbsoluta = path.join(__dirname, '/'); // Ruta absoluta a la carpeta personalizada
        cb(null, rutaAbsoluta);
      },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Nombre del archivo en el servidor
    },
});

// Crea una instancia de multer con la configuración
const upload = multer({ storage: storage });

// Ruta para iniciar el proceso de autenticación
app.get('/auth', (req, res) => {
  const clientId = '2qvtwlt908qi45m';
  const redirectUri = 'http://localhost';
  const authUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}`;
  res.redirect(authUrl);
});

// Ruta para recibir el código de autorización
app.get('/callback', async (req, res) => {
  const clientId = '2qvtwlt908qi45m';
  const clientSecret = '32g6lopnxs9k5fi';
  const redirectUri = 'http://localhost';
  const code = req.query.code;

  // Intercambia el código por un token de acceso
  try {
    const response = await axios.post('https://api.dropboxapi.com/oauth2/token', null, {
      params: {
        code,
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      },
    });

    const accessToken = response.data.access_token;

    // Aquí puedes guardar el token de acceso en una base de datos o en una variable global para su posterior uso.

    res.send('Autenticación exitosa. Puedes cerrar esta ventana.');
  } catch (error) {
    console.error(error);
    res.send('Error en la autenticación.');
  }
});

// Inicia el servidor
app.listen(port, () => {
  console.log(`Servidor web en funcionamiento en http://localhost:${port}`);
});

// ...

// Ruta para subir un archivo a Dropbox
app.post('/upload', upload.single('file'), async (req, res) => {
  const accessToken = 'sl.Bmn8B4JF_UqLiwRyVLcZ4df5Dxb-CG30WAlPCX5OnlDFi-ECUwJJ2Ilj77LiyjlkpJpIVcRj3dmIonQVZ85xFoMUyq7z9Urn9sbYoj_nafNi_s8sfj7ANqLuIH7muGP0fzTrXM4AnyQY'; // Reemplaza con tu token de acceso
  const file = req.files; // Suponiendo que estás utilizando algún middleware para manejar la carga de archivos

  // Configura la solicitud para subir el archivo a Dropbox
  const uploadUrl = 'https://content.dropboxapi.com/2/files/upload'; // URL de la API de Dropbox para subir archivos
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Dropbox-API-Arg': JSON.stringify({
      'path': `/Aplicaciones/CsvFileTomas/${file.name}`, // Ruta en Dropbox donde se guardará el archivo
      'mode': 'add', // Modo de carga (puede ser 'add', 'overwrite', etc.)
    }),
    'Content-Type': 'application/octet-stream', // Tipo de contenido para la carga de archivos
  };

  try {
    // Realiza la solicitud POST para subir el archivo a Dropbox
    const response = await axios.post(uploadUrl, file.data, { headers });
    res.send('Archivo subido exitosamente.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al subir el archivo a Dropbox.');
  }
});

// Ruta para descargar un archivo de Dropbox
app.get('/download', async (req, res) => {
  const accessToken = 'sl.Bmn8B4JF_UqLiwRyVLcZ4df5Dxb-CG30WAlPCX5OnlDFi-ECUwJJ2Ilj77LiyjlkpJpIVcRj3dmIonQVZ85xFoMUyq7z9Urn9sbYoj_nafNi_s8sfj7ANqLuIH7muGP0fzTrXM4AnyQY'; // Reemplaza con tu token de acceso
  const filename = req.query.filename; // Nombre del archivo que se va a descargar
  const path = `/Aplicaciones/CsvFileTomas/${filename}`; // Ruta del archivo en Dropbox

  // Configura la solicitud para descargar el archivo de Dropbox
  const downloadUrl = 'https://content.dropboxapi.com/2/files/download'; // URL de la API de Dropbox para descargar archivos
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Dropbox-API-Arg': JSON.stringify({ 'path': path }),
  };

  try {
    // Realiza la solicitud POST para descargar el archivo de Dropbox
    const response = await axios.post(downloadUrl, null, { headers, responseType: 'stream' });

    // Establece el nombre del archivo en la respuesta
    res.attachment(filename);

    // Envía el archivo como respuesta
    response.data.pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al descargar el archivo de Dropbox.');
  }
});

