import type { Prisma } from "@prisma/client";
import { createMiddleware } from "hono/factory";
import {
  validFields,
  defaultIncludes,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  ERROR_MESSAGES,
} from "./constants.js";

export const filterMiddleware = createMiddleware(async (c, next) => {
  const fields = c.req.query("fields");

  let queryOptions: Prisma.countriesFindManyArgs = {};

  // Handle fields
  if (fields) {
    const fieldsArray = fields.split(",").map((field) => field.trim());
    const selectedFields = fieldsArray.filter((field) =>
      validFields.includes(field)
    );

    if (selectedFields.length === 0) {
      return c.json({ error: ERROR_MESSAGES.INVALID_FIELDS }, 400);
    }

    queryOptions.select = selectedFields.reduce(
      (acc, field) => ({ ...acc, [field]: true }),
      {}
    );

    c.set("fieldsModified", true);
  } else {
    queryOptions.include = { ...defaultIncludes };
  }

  c.set("queryOptions", queryOptions);
  return next();
});

// Middleware for pagination
export const paginationMiddleware = createMiddleware(async (c, next) => {
  const page = parseInt(c.req.query("page") || DEFAULT_PAGE.toString(), 10);
  const limit = parseInt(c.req.query("limit") || DEFAULT_LIMIT.toString(), 10);
  const offset = (page - 1) * limit;

  const queryOptions = c.get("queryOptions") || {};
  queryOptions.take = limit;
  queryOptions.skip = offset;

  c.set("queryOptions", queryOptions);
  c.set("paginationMeta", { page, limit });

  return next();
});
