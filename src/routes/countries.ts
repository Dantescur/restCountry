import { Hono } from "hono";
import prisma from "../lib/prisma.js";
import { filterMiddleware, paginationMiddleware } from "../middlewares.js";
import { ERROR_MESSAGES, type Variables } from "../constants.js";

export const countriesRoutes = new Hono<{
  Variables: Variables;
}>();

// Apply both middlewares to countriesRoutes
countriesRoutes.use("*", filterMiddleware, paginationMiddleware);

countriesRoutes.get("/all", async (c) => {
  const queryOptions = c.get("queryOptions");
  const { page, limit } = c.get("paginationMeta");

  try {
    const countries = await prisma.countries.findMany(queryOptions);

    // Calculate the total number of matching countries
    const total = await prisma.countries.count({
      where: queryOptions.where, // Ensure consistency with the query
    });

    const fieldsModified = c.get("fieldsModified") || false;

    if (fieldsModified) {
      c.status(206);
    }

    return c.json({
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: countries,
    });
  } catch (error) {
    console.error("Error fetching countries:", error);
    return c.json({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR }, 500);
  }
});

countriesRoutes.get("/alpha", async (c) => {
  const queryOptions = c.get("queryOptions");
  const { page, limit } = c.get("paginationMeta");
  const codes = c.req.query("code");

  if (!codes) {
    return c.json({ error: `${ERROR_MESSAGES.MISSING_PARAMETER}: code` }, 400);
  }

  const codesArray = codes.split(",").map((field) => field.trim());

  try {
    // Calculate the total number of matching countries
    const total = await prisma.countries.count({
      where: {
        OR: [
          { cca2: { in: codesArray, mode: "insensitive" } },
          { ccn3: { in: codesArray, mode: "insensitive" } },
          { cca3: { in: codesArray, mode: "insensitive" } },
          { cioc: { in: codesArray, mode: "insensitive" } },
        ],
      },
    });

    // Fetch the paginated results
    const countries = await prisma.countries.findMany({
      ...queryOptions,
      where: {
        OR: [
          { cca2: { in: codesArray, mode: "insensitive" } },
          { ccn3: { in: codesArray, mode: "insensitive" } },
          { cca3: { in: codesArray, mode: "insensitive" } },
          { cioc: { in: codesArray, mode: "insensitive" } },
        ],
      },
    });

    if (countries && countries.length === 0) {
      return c.json({ error: ERROR_MESSAGES.COUNTRY_NOT_FOUND }, 404);
    }

    const fieldsModified = c.get("fieldsModified") || false;

    if (fieldsModified) {
      c.status(206);
    }

    return c.json({
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: countries,
    });
  } catch (error) {
    console.error("Error fetching countries:", error);
    return c.json({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR }, 500);
  }
});

countriesRoutes.get("/currency/:currency", async (c) => {
  const currency = c.req.param("currency");

  if (!currency) {
    return c.json(
      { error: `${ERROR_MESSAGES.MISSING_PARAMETER}: currency` },
      400
    );
  }

  try {
    const matchingCurrencies = await prisma.currencies.findMany({
      where: {
        OR: [
          { code: currency.toUpperCase() },
          { name: { contains: currency, mode: "insensitive" } },
        ],
      },
      include: {
        countries: true,
      },
    });

    if (matchingCurrencies.length === 0) {
      return c.json({ error: ERROR_MESSAGES.CURRENCY_NOT_FOUND }, 404);
    }

    const currencyCodes = [
      ...new Set(
        matchingCurrencies
          .map((currency) => currency.code)
          .filter((code): code is string => code !== null)
      ),
    ];

    // Calculate the total number of matching countries
    const total = await prisma.countries.count({
      where: {
        currencies: {
          some: {
            code: { in: currencyCodes },
          },
        },
      },
    });

    // Fetch the paginated results
    const countries = await prisma.countries.findMany({
      where: {
        currencies: {
          some: {
            code: { in: currencyCodes },
          },
        },
      },
      ...c.get("queryOptions"),
    });

    if (countries.length === 0) {
      return c.json({ error: ERROR_MESSAGES.COUNTRY_NOT_FOUND }, 404);
    }

    const { page, limit } = c.get("paginationMeta");

    const fieldsModified = c.get("fieldsModified") || false;

    if (fieldsModified) {
      c.status(206);
    }

    return c.json({
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: countries,
    });
  } catch (error) {
    console.error("Error fetching countries by currency:", error);
    return c.json({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR }, 500);
  }
});

countriesRoutes.get("/lang/:language", async (c) => {
  const language = c.req.param("language");

  if (!language) {
    return c.json(
      { error: `${ERROR_MESSAGES.MISSING_PARAMETER}: language` },
      400
    );
  }

  try {
    const matchingLanguage = await prisma.languages.findMany({
      where: {
        OR: [
          { code: language.toLowerCase() },
          { name: { contains: language, mode: "insensitive" } },
        ],
      },
      include: {
        countries: true,
      },
    });

    if (matchingLanguage.length === 0) {
      return c.json({ error: ERROR_MESSAGES.LANGUAGE_NOT_FOUND });
    }

    const languagesCode = [
      ...new Set(
        matchingLanguage
          .map((lang) => lang.code)
          .filter((code): code is string => code !== null)
      ),
    ];

    const total = await prisma.countries.count({
      where: {
        languages: {
          some: {
            code: { in: languagesCode },
          },
        },
      },
    });

    const countries = await prisma.countries.findMany({
      where: {
        languages: {
          some: {
            code: { in: languagesCode },
          },
        },
      },
      ...c.get("queryOptions"),
    });

    if (countries.length === 0) {
      return c.json({ error: ERROR_MESSAGES.COUNTRY_NOT_FOUND });
    }

    const { page, limit } = c.get("paginationMeta");

    const fieldsModified = c.get("fieldsModified") || false;

    if (fieldsModified) {
      c.status(206);
    }

    return c.json({
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: countries,
    });
  } catch (error) {}
});
