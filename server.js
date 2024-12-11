import express from 'express'
import { PrismaClient } from '@prisma/client'
import cors from 'cors'
import bcrypt from 'bcrypt'

const port = process.env.PORT || 3000;

const prisma = new PrismaClient()
const app = express();
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('Hello World!');
});


app.listen(port, () => {
        console.log("Server is running on port 3000");
})
