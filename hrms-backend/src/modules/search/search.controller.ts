import { Request, Response } from "express";
import { sendSuccess } from "../../shared/utils/ApiResponse";
import * as searchService from "./search.service";

async function search(req: Request, res: Response): Promise<void> {
  const { q } = req.validated!.query as { q: string };
  const result = await searchService.globalSearch(q);
  sendSuccess(res, result);
}

export { search };
