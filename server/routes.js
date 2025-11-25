import express from "express";
import {
  createUser,
  getUserByEmail,
  createProducto,
  getProductosByUserId,
  getProductoById,
  updateProducto,
  deleteProducto,
} from "./database.js";
import { generateToken, hashPassword, comparePassword, authMiddleware } from "./auth.js";

const router = express.Router();

// ========================
// RUTAS DE AUTENTICACIÓN
// ========================

// Registro
router.post("/api/register", async (req, res) => {
  try {
    const { usuario, correo, contraseña } = req.body;

    if (!usuario || !correo || !contraseña) {
      return res.status(400).json({ error: "Faltan datos requeridos" });
    }

    // Verificar si usuario ya existe
    const userExists = await getUserByEmail(correo);
    if (userExists) {
      return res.status(400).json({ error: "El correo ya está registrado" });
    }

    // Hash de contraseña
    const hashedPassword = await hashPassword(contraseña);

    // Crear usuario
    const result = await createUser(usuario, correo, hashedPassword);

    // Generar token
    const token = generateToken(result.lastInsertRowid);

    res.json({
      success: true,
      token,
      user: {
        id: result.lastInsertRowid,
        usuario,
        correo,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post("/api/login", async (req, res) => {
  try {
    const { correo, contraseña } = req.body;

    if (!correo || !contraseña) {
      return res.status(400).json({ error: "Correo y contraseña requeridos" });
    }

    // Buscar usuario
    const user = await getUserByEmail(correo);
    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Verificar contraseña
    const validPassword = await comparePassword(contraseña, user.contraseña);
    if (!validPassword) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Generar token
    const token = generateToken(user.id);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        usuario: user.usuario,
        correo: user.correo,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================
// RUTAS DE PRODUCTOS (CRUD)
// ========================

// READ - Obtener todos los productos del usuario
router.get("/api/productos", authMiddleware, async (req, res) => {
  try {
    const productos = await getProductosByUserId(req.userId);
    res.json({ success: true, data: productos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE - Crear nuevo producto
router.post("/api/productos", authMiddleware, async (req, res) => {
  try {
    const { nombre, categoria, precio, existencias } = req.body;

    if (!nombre || !categoria || precio === undefined || existencias === undefined) {
      return res.status(400).json({ error: "Faltan datos requeridos" });
    }

    const result = await createProducto(nombre, categoria, precio, existencias, req.userId);

    res.json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        nombre,
        categoria,
        precio,
        existencias,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE - Actualizar producto
router.put("/api/productos/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, categoria, precio, existencias } = req.body;

    if (!nombre || !categoria || precio === undefined || existencias === undefined) {
      return res.status(400).json({ error: "Faltan datos requeridos" });
    }

    // Verificar que el producto pertenece al usuario
    const producto = await getProductoById(id, req.userId);
    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    await updateProducto(id, nombre, categoria, precio, existencias, req.userId);

    res.json({
      success: true,
      data: { id, nombre, categoria, precio, existencias },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Eliminar producto
router.delete("/api/productos/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el producto pertenece al usuario
    const producto = await getProductoById(id, req.userId);
    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    await deleteProducto(id, req.userId);

    res.json({ success: true, message: "Producto eliminado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
