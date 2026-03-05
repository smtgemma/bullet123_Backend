
import cors from "cors";
import path from "path";

import router from "./app/routes";
import cookieParser from "cookie-parser";
import notFound from "./app/middlewares/notFound";
import express, { Application, Request, Response } from "express";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";




const app: Application = express();

app.use(cors({ origin: ["http://localhost:3000","http://localhost:3001","http://206.162.244.134:3002","http://206.162.244.134:3001"], credentials: true }));

app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/v1", router);

app.get("/", async (req: Request, res: Response) => {
	// 
	res.send("API is running...");
});


app.use(globalErrorHandler);
app.use(notFound);


export default app;
