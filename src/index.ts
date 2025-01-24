import { serve } from "@hono/node-server";
import { Hono } from "hono";
import prisma from "./lib/prisma.js";
import { poweredBy } from "hono/powered-by";
import { logger } from "hono/logger";
import { createMiddleware } from "hono/factory";
import type { Prisma } from "@prisma/client";
import { count } from "console";

type Variables = {
  queryOptions: Prisma.countriesFindManyArgs;
  paginationMeta: {
    page: number;
    limit: number;
  };
};

const app = new Hono<{
  Variables: Variables;
}>();

app.use(poweredBy());
app.use(logger());

const validFields = [
  "id",
  "name_common",
  "name_official",
  "cca2",
  "ccn3",
  "cca3",
  "cioc",
  "fifa",
  "independent",
  "status",
  "un_member",
  "region",
  "subregion",
  "landlocked",
  "area",
  "flag",
  "population",
  "alt_spellings",
  "borders_borders_border_idTocountries",
  "borders_borders_country_idTocountries",
  "capitals",
  "car",
  "continents",
  "currencies",
  "demonyms",
  "flags",
  "gini",
  "idd",
  "languages",
  "latlng",
  "maps",
  "native_names",
  "timezones",
  "tld",
  "translations",
];

const defaultIncludes = {
  borders_borders_border_idTocountries: true,
  currencies: true,
  languages: true,
  maps: true,
  timezones: true,
  translations: true,
  alt_spellings: true,
  capitals: true,
  car: true,
  continents: true,
  demonyms: true,
  flags: true,
  gini: true,
  idd: true,
  latlng: true,
  tld: true,
  native_names: true,
};

const queryMiddleware = createMiddleware(async (c, next) => {
  const fields = c.req.query("fields");
  const page = parseInt(c.req.query("page") || "1", 10);
  const limit = parseInt(c.req.query("limit") || "10", 10);
  const offset = (page - 1) * limit;

  let queryOptions: Prisma.countriesFindManyArgs = {};

  // Handle fields
  if (fields) {
    const fieldsArray = fields.split(",").map((field) => field.trim());
    const selectedFields = fieldsArray.filter((field) =>
      validFields.includes(field),
    );

    if (selectedFields.length === 0) {
      return c.json({ error: "Invalid fields requested." }, 400);
    }

    queryOptions.select = selectedFields.reduce(
      (acc, field) => ({ ...acc, [field]: true }),
      {},
    );
  } else {
    queryOptions.include = { ...defaultIncludes };
  }

  queryOptions.take = limit;
  queryOptions.skip = offset;

  c.set("queryOptions", queryOptions);
  c.set("paginationMeta", { page, limit });

  return next();
});

const countriesRoutes = new Hono<{
  Variables: Variables;
}>();

countriesRoutes.use("*", queryMiddleware);

countriesRoutes.get("/all", async (c) => {
  const queryOptions = c.get("queryOptions");
  const { page, limit } = c.get("paginationMeta");

  try {
    const countries = await prisma.countries.findMany(queryOptions);

    const total = await prisma.countries.count();

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
    return c.json({ error: "Internal server error." }, 500);
  }
});

const basicRoutes = new Hono();

basicRoutes.get("/name/:name", async (c) => {
  const name = c.req.param("name");

  if (!name) {
    return c.json({ error: "Missing parameter: name" }, 400);
  }

  try {
    const country = await prisma.countries.findFirst({
      where: {
        name_common: name,
      },
      include: { ...defaultIncludes },
    });

    if (!country) {
      return c.json({ error: "Country not found" }, 404);
    }

    return c.json(country);
  } catch (error) {
    console.error("Error fetching countries:", error);
    return c.json({ error: "Internal server error." }, 500);
  }
});

countriesRoutes.get("/alpha", async (c) => {
  const queryOptions = c.get("queryOptions");
  const { page, limit } = c.get("paginationMeta");
  const codes = c.req.query("code");

  if (!codes) {
    return c.json({ error: "Missing parameter: code" }, 400);
  }

  const codesArray = codes.split(",").map((field) => field.trim());

  try {
    const countries = await prisma.countries.findMany({
      ...queryOptions,
      where: {
        OR: [
          { cca2: { in: codesArray } },
          { ccn3: { in: codesArray } },
          { cca3: { in: codesArray } },
          { cioc: { in: codesArray } },
        ],
      },
    });

    if (countries && countries.length === 0) {
      return c.json({ error: "Countries not found" }, 404);
    }

    const total = countries.length + 1;

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
    return c.json({ error: "Internal server error." }, 500);
  }
});

basicRoutes.get("/alpha/:code", async (c) => {
  const code = c.req.param("code");

  if (!code) {
    return c.json({ error: "Missing parameter: code" }, 400);
  }

  try {
    const country = await prisma.countries.findFirst({
      where: {
        OR: [{ cca2: code }, { ccn3: code }, { cca3: code }, { cioc: code }],
      },
    });

    if (!country) {
      return c.json({ error: "Countries not found" }, 404);
    }

    return c.json(country);
  } catch (error) {
    console.error("Error fetching countries:", error);
    return c.json({ error: "Internal server error." }, 500);
  }
});

app.get("/currency/:currency", async (c) => {
  const currency = c.req.param("currency");

  if (!currency) {
    return c.json({ error: "Missing parameter: currency" }, 400);
  }

  try {
    const matchingCurrencies = await prisma.currencies.findMany({
      where: {
        OR: [
          { code: currency.toUpperCase() }, // Case insensitive code search
          { name: { contains: currency, mode: "insensitive" } }, // Case insensitive name search
        ],
      },
      include: {
        countries: true,
      },
    });

    if (matchingCurrencies.length === 0) {
      return c.json({ error: "Currency not found" }, 404);
    }

    const currencyCodes = [
      ...new Set(
        matchingCurrencies
          .map((currency) => currency.code)
          .filter((code): code is string => code !== null),
      ),
    ];

    const countriesQuery = prisma.countries.findMany({
      where: {
        currencies: {
          some: {
            code: { in: currencyCodes },
          },
        },
      },
      ...c.get("queryOptions"),
    });

    const countries = await countriesQuery;

    if (countries.length === 0) {
      return c.json(
        { error: "No countries found with the specified currency" },
        404,
      );
    }

    const { page, limit } = c.get("paginationMeta");
    const total = countries.length;

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
    return c.json({ error: "Internal server error." }, 500);
  }
});

app.route("/", countriesRoutes);
app.route("/", basicRoutes);

app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json({ error: "An unexpected error occurred." }, 500);
});

const port = 3000;
console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
