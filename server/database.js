import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Inicializar base de datos con tablas
export async function initializeDatabase() {
  try {
    // Tabla de usuarios (login)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario TEXT NOT NULL UNIQUE,
        correo TEXT NOT NULL UNIQUE,
        contraseña TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de productos
    await db.execute(`
      CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        categoria TEXT NOT NULL,
        precio REAL NOT NULL,
        existencias INTEGER NOT NULL,
        usuario_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      )
    `);

    console.log("✓ Base de datos inicializada correctamente");
  } catch (error) {
    console.error("Error inicializando base de datos:", error);
  }
}

// Funciones para usuarios
export async function createUser(usuario, correo, contraseña) {
  try {
    const result = await db.execute({
      sql: "INSERT INTO usuarios (usuario, correo, contraseña) VALUES (?, ?, ?)",
      args: [usuario, correo, contraseña],
    });
    return result;
  } catch (error) {
    throw new Error(`Error creando usuario: ${error.message}`);
  }
}

export async function getUserByEmail(correo) {
  try {
    const result = await db.execute({
      sql: "SELECT * FROM usuarios WHERE correo = ?",
      args: [correo],
    });
    return result.rows[0] || null;
  } catch (error) {
    throw new Error(`Error obteniendo usuario: ${error.message}`);
  }
}

export async function getUserById(id) {
  try {
    const result = await db.execute({
      sql: "SELECT * FROM usuarios WHERE id = ?",
      args: [id],
    });
    return result.rows[0] || null;
  } catch (error) {
    throw new Error(`Error obteniendo usuario: ${error.message}`);
  }
}

// Funciones para productos
export async function createProducto(nombre, categoria, precio, existencias, usuarioId) {
  try {
    const result = await db.execute({
      sql: "INSERT INTO productos (nombre, categoria, precio, existencias, usuario_id) VALUES (?, ?, ?, ?, ?)",
      args: [nombre, categoria, precio, existencias, usuarioId],
    });
    return result;
  } catch (error) {
    throw new Error(`Error creando producto: ${error.message}`);
  }
}

export async function getProductosByUserId(usuarioId) {
  try {
    const result = await db.execute({
      sql: "SELECT * FROM productos WHERE usuario_id = ? ORDER BY created_at DESC",
      args: [usuarioId],
    });
    return result.rows || [];
  } catch (error) {
    throw new Error(`Error obteniendo productos: ${error.message}`);
  }
}

export async function getProductoById(id, usuarioId) {
  try {
    const result = await db.execute({
      sql: "SELECT * FROM productos WHERE id = ? AND usuario_id = ?",
      args: [id, usuarioId],
    });
    return result.rows[0] || null;
  } catch (error) {
    throw new Error(`Error obteniendo producto: ${error.message}`);
  }
}

export async function updateProducto(id, nombre, categoria, precio, existencias, usuarioId) {
  try {
    const result = await db.execute({
      sql: "UPDATE productos SET nombre = ?, categoria = ?, precio = ?, existencias = ? WHERE id = ? AND usuario_id = ?",
      args: [nombre, categoria, precio, existencias, id, usuarioId],
    });
    return result;
  } catch (error) {
    throw new Error(`Error actualizando producto: ${error.message}`);
  }
}

export async function deleteProducto(id, usuarioId) {
  try {
    const result = await db.execute({
      sql: "DELETE FROM productos WHERE id = ? AND usuario_id = ?",
      args: [id, usuarioId],
    });
    return result;
  } catch (error) {
    throw new Error(`Error eliminando producto: ${error.message}`);
  }
}

export default db;
