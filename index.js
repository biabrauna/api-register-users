// Using CommonJS for better Vercel compatibility
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const cors = require('cors');
const corsMiddleware = require('./corsMiddleware');

// Optimize Prisma for serverless environment
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Handle Prisma connection in a serverless environment
async function closeConnection() {
  await prisma.$disconnect();
}

process.on('beforeExit', closeConnection);

const app = express();
const port = process.env.PORT || 3000;

// Apply the custom CORS middleware
app.use(corsMiddleware);

// Apply standard cors middleware as backup
app.use(cors({
  origin: true,
  credentials: true
}));

// Handle preflight requests
app.options('*', corsMiddleware);

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password, biografia, confirmPassword, age } = req.body;
    
    // Validation
    if (!name) {
      return res.status(422).json({ message: "O nome é obrigatório" });
    }
    if (!email) {
      return res.status(422).json({ message: "O email é obrigatório" });
    }
    if (!password) {
      return res.status(422).json({ message: "A senha é obrigatória" });
    }
    if (!age) {
      return res.status(422).json({ message: "A idade é obrigatória" });
    }
    if (password !== confirmPassword) {    
      return res.status(422).json({ message: "As senhas devem ser iguais" });
    }

    // Check if user exists
    const userExists = await prisma.user.findUnique({ where: { email: email } });
    
    if (userExists) {
      return res.status(422).json({ message: "O email já está em uso" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user with proper defaults for schema
    const user = await prisma.user.create({
      data: {
        name: name,
        email: email,
        password: passwordHash,
        age: age,
        biografia: biografia || "",
        pontos: 0,
        seguidores: 0,
        seguindo: 0
      }
    });

    // Return created user (without password)
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Erro no servidor. Por favor, tente novamente." });
  }
});

app.post('/desafios', async (req, res) => {
  try {
    const desafio = await prisma.desafios.create({
      data: {
        desafios: req.body.desafios,
        valor: req.body.valor
      }
    });
    res.status(201).json(desafio);
  } catch (error) {
    console.error("Create challenge error:", error);
    res.status(500).json({ message: "Erro ao criar desafio. Por favor, tente novamente." });
  }
});

app.post('/profilePic', async (req, res) => {
  try {
    const profilePic = await prisma.profilePic.create({
      data: {
        userId: req.body.userId,
        name: req.body.name,
        url: req.body.url
      }
    });
    res.status(201).json(profilePic);
  } catch (error) {
    console.error("Profile picture error:", error);
    res.status(500).json({ message: "Erro ao salvar foto de perfil. Por favor, tente novamente." });
  }
});

app.get('/profilePic', async (req, res) => {
  try {
    const profilePics = await prisma.profilePic.findMany();
    res.status(200).json(profilePics);
  } catch (error) {
    console.error("Get profile pics error:", error);
    res.status(500).json({ message: "Erro ao buscar fotos de perfil." });
  }
});

app.get('/desafios', async (req, res) => {
  try {
    const desafios = await prisma.desafios.findMany();
    res.status(200).json(desafios);
  } catch (error) {
    console.error("Get challenges error:", error);
    res.status(500).json({ message: "Erro ao buscar desafios." });
  }
});

app.get('/usuarios', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        age: true,
        biografia: true,
        pontos: true,
        seguidores: true,
        seguindo: true
      }
    });
    res.status(200).json(users);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Erro ao buscar usuários." });
  }
});

app.get('/users/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.params.id
      },
      select: {
        id: true,
        name: true,
        email: true,
        age: true,
        biografia: true,
        pontos: true,
        seguidores: true,
        seguindo: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Erro ao buscar usuário." });
  }
});

app.put('/usuarios/:id', async (req, res) => {
  try {
    const updatedUser = await prisma.user.update({
      where: {
        id: req.params.id
      },
      data: req.body,
      select: {
        id: true,
        name: true,
        email: true,
        age: true,
        biografia: true,
        pontos: true,
        seguidores: true,
        seguindo: true
      }
    });
    
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ message: "Erro ao atualizar usuário." });
  }
});

app.delete('/usuarios/:id', async (req, res) => {
  try {
    await prisma.user.delete({
      where: {
        id: req.params.id
      }
    });
    
    res.status(200).json({ message: "Usuário deletado com sucesso" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Erro ao deletar usuário." });
  }
});

app.post('/auth/user', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email) {
      return res.status(422).json({ message: "O email é obrigatório" });
    }
    if (!password) {
      return res.status(422).json({ message: "A senha é obrigatória" });
    }

    const user = await prisma.user.findUnique({ where: { email: email } });

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(422).json({ message: "Senha inválida" });
    }

    res.status(200).json({ 
      message: "Login realizado com sucesso", 
      userId: user.id,
      name: user.name
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Erro no login. Por favor, tente novamente." });
  }
});

app.post('/posts', async (req, res) => {
  try {
    const post = await prisma.posts.create({
      data: {
        userId: req.body.userId,
        url: req.body.url,
        likes: req.body.likes || 0
      }
    });
    
    res.status(201).json(post);
  } catch (error) {
    console.error("Create post error:", error);
    res.status(422).json({ message: "Erro ao postar a foto. Tente novamente." });
  }
});

app.get('/posts', async (req, res) => {
  try {
    const posts = await prisma.posts.findMany();
    res.status(200).json(posts);
  } catch (error) {
    console.error("Get posts error:", error);
    res.status(500).json({ message: "Erro ao buscar posts." });
  }
});

app.post('/desafiosConcluidos', async (req, res) => {
  try {
    const desafioConcluido = await prisma.desafiosConcluidos.create({
      data: {
        userId: req.body.userId,
        desafioId: req.body.desafioId
      }
    });
    
    res.status(201).json(desafioConcluido);
  } catch (error) {
    console.error("Complete challenge error:", error);
    res.status(500).json({ message: "Erro ao registrar desafio concluído." });
  }
});

// Add a specific route to handle CORS preflight for troubleshooting
app.get('/cors-test', (req, res) => {
  res.json({ message: 'CORS test successful', origin: req.headers.origin });
});

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.headers.origin || 'unknown'}`);
  next();
});

// Export for Vercel serverless function
module.exports = app;

// Start server in development environment
if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`CORS is configured for: ${corsMiddleware.allowedOrigins || 'all origins'}`);
  });
}