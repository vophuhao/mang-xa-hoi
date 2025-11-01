import { Router } from "express";
import {
  createReportHandler,
  getReportsHandler,
  getReportDetailHandler,
  resolveReportsByPostHandler,
  resolveReportsByUserHandler,
} from "@/controllers/report.controller";

const ReportRoutes = Router();


ReportRoutes.post("/create", createReportHandler);
ReportRoutes.get("/list", getReportsHandler);
ReportRoutes.get("/:reportId", getReportDetailHandler);
ReportRoutes.patch("/resolve/:postId", resolveReportsByPostHandler);
ReportRoutes.patch("/resolve-user/:userId", resolveReportsByUserHandler);


export default ReportRoutes;