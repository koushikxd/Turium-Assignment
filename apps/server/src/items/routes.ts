import { itemIdParams } from "@turium-assignment/contracts";
import type { ItemsResponse } from "@turium-assignment/contracts";
import { Router } from "express";
import type { DatabaseSync } from "node:sqlite";

import { AppError } from "../http/errors";
import { validate } from "../http/validate";
import { deleteItem, listItems } from "./repository";

export function itemsRouter(db: DatabaseSync) {
  const router = Router();
  router.get("/items", (_req, res) => {
    const body: ItemsResponse = { items: listItems(db) };
    res.status(200).json(body);
  });
  router.delete("/items/:id", (req, res) => {
    const { id } = validate(itemIdParams, req, "params");
    if (!deleteItem(db, id)) throw new AppError("ITEM_NOT_FOUND", `No item with id ${id}.`);
    res.status(204).end();
  });
  return router;
}
