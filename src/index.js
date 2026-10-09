import express from "express";
import dotenv from "dotenv";
import memberRoutes from "./routes/memberRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import loanRoutes from "./routes/loanRoutes.js";
import { errorHandler, notFound } from "./middlewares/errorHandler.js";

dotenv.config();

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));

app.get("/", (req, res) => {
  res.json({
    name: "Library Loan API",
    version: "1.0.0",
    endpoints: {
      members: "/api/members",
      books: "/api/books",
      loans: "/api/loans",
      filter_example: "/api/loans?status=Terlambat",
    },
  });
});

app.use("/api/members", memberRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/loans", loanRoutes);

app.use(notFound);
app.use(errorHandler);

// Di Vercel, app di-export sebagai serverless handler; listen hanya untuk lokal.
if (!process.env.VERCEL) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Server running on port ${port}`));
}

export default app;
