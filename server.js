import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import cors from 'cors'

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/auth/register', async (req, res) => {
    const {name, email, password, biografia, confirmPassword, age} = req.body;
    
    if(!name){
        return res.status(422).json({message: "O nome e obrigatorio"})
    }
    if(!email){
        return res.status(422).json({message: "O email e obrigatorio"})
    }
    if(!password){
        return res.status(422).json({message: "A senha e obrigatoria"})
    }
    if(!age){
        return res.status(422).json({message: "A idade e obrigatoria"})
    }
    if (password!==confirmPassword){    
        return res.status(422).json({message: "As senhas devem ser iguais"})
    }

    const userExists = await prisma.user.findUnique({where: {email: email}})
    
    if (userExists) {
        return res.status(422).json({message: "O email ja esta em uso"})
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    
    try {
        
        const user = await prisma.user.create({
        data: {
            name: name,
            email: email,
            password: passwordHash,
            age: age,
            biografia: biografia,
        }
    })} catch (error) {
        console.log(error)
    }

    res.status(201).send(req.body);
});

app.post('/desafios', async (req, res) => {

    await prisma.desafios.create({
        data: {
            desafios: req.body.desafios,
            valor: req.body.valor
        }
        
    })

    res.status(201).send(req.body);
});

app.post('/profilePic', async (req, res) => {

    await prisma.profilePic.create({
        data: {
            userId: req.body.userId,
            name: req.body.name,
            url: req.body.url
        }
        
    })

    res.status(201).send(req.body);
});



app.get('/profilePic', async (req, res) => {
    const profilePics = await prisma.profilePic.findMany()
    res.status(200).json(profilePics);
});

app.get('/desafios', async (req, res) => {
    const desafios = await prisma.desafios.findMany()
    res.status(200).json(desafios);
});

app.get('/usuarios', async (req, res) => {
    let users = []
    users = await prisma.user.findMany()
    res.status(200).json(users);
});

app.get('/users/:id', async (req, res) => {
    const user = await prisma.user.findUnique({
        where: {
            id: req.params.id
        }
    })
    if (!user) {
        return res.status(404).json({message: "Usuário não encontrado"})
    }
    res.status(200).json(user);
});


app.put('/usuarios/:id', async (req, res) => {
    await prisma.user.update({
        where: {
            id: req.params.id
        },
        data: {
            name: req.body.name,
        }
    })

    res.status(201).send(req.body);
});

app.delete('/usuarios/:id', async (req, res) => {        
    await prisma.user.delete({
        where: {
            id: req.params.id
        }
    })

    res.status(200).json({message: "Usuário deletado com sucesso"});
})

app.post('/auth/user', async (req, res) => {
    const {email, password} = req.body;
    
    if(!email){
        return res.status(422).json({message: "O email e obrigatorio"})
    }
    if(!password){
        return res.status(422).json({message: "A senha e obrigatoria"})
    }

    const user = await prisma.user.findUnique({where: {email: email}})

    if(!user){
        return res.status(404).json({message: "Usuário não encontrado"})
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if(!isPasswordValid){
        return res.status(422).json({message: "Senha inválida"})
    }


    res.status(200).json({message: "Login realizado com sucesso", userId: user.id});

    
})
        

app.post('/posts', async (req, res) => {
    try{
        await prisma.posts.create({
        data: {
            userId: req.body.userId,
            url: req.body.url,
            likes: req.body.likes
        }
    })
    res.status(201).send(req.body); 
    }  catch (error) {
        res.status(422).json({message: "Erro ao postar a foto. Tente novamente."})
    }
    
})

app.get('/posts', async (req, res) => {
    const posts = await prisma.posts.findMany()
    res.status(200).json(posts);
});

app.post('/desafiosConcluidos', async (req, res) => {
    await prisma.desafiosConcluidos.create({
        data: {
            userId: req.body.userId,
            desafioId: req.body.desafioId
        }
    })
})

process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit();
  });  

app.listen(port, () => {
        console.log("Server is running on port 3000");
})
