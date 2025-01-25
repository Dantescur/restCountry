import { Hono } from "hono";
import prisma from "../lib/prisma.js";
import { defaultIncludes, ERROR_MESSAGES } from "../constants.js";
import toNameCase from "../utils/toNameCase.js";
import { filterMiddleware } from "../middlewares.js";

export const basicRoutes = new Hono();

basicRoutes.get("/name/:name", async (c) => {
  const name = c.req.param("name");

  if (!name) {
    return c.json({ error: `${ERROR_MESSAGES.MISSING_PARAMETER}: name` }, 400);
  }

  try {
    const countries = await prisma.countries.findMany({
      where: {
        name_common: name,
      },
      include: { ...defaultIncludes },
    });

    if (countries.length === 0) {
      return c.json({ error: ERROR_MESSAGES.COUNTRY_NOT_FOUND }, 404);
    }

    return c.json(countries);
  } catch (error) {
    console.error("Error fetching countries:", error);
    return c.json({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR }, 500);
  }
});

basicRoutes.get("/alpha/:code", async (c) => {
  const code = c.req.param("code");

  if (!code) {
    return c.json({ error: `${ERROR_MESSAGES.MISSING_PARAMETER}: code` }, 400);
  }

  try {
    const country = await prisma.countries.findFirst({
      where: {
        OR: [
          { cca2: code.toUpperCase() }, // Match by cca2
          { ccn3: code }, // Match by ccn3
          { cca3: code.toUpperCase() }, // Match by cca3
          { cioc: code.toUpperCase() }, // Match by cioc
        ],
      },
    });

    if (!country) {
      return c.json({ error: ERROR_MESSAGES.COUNTRY_NOT_FOUND }, 404);
    }

    return c.json(country);
  } catch (error) {
    console.error("Error fetching countries:", error);
    return c.json({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR }, 500);
  }
});

basicRoutes.get("/capital/:name", filterMiddleware, async (c) => {
  const capital = c.req.param("name");

  if (!capital) {
    return c.json({ error: `${ERROR_MESSAGES.MISSING_PARAMETER}: capital` });
  }

  const normalCapital = toNameCase(capital);

  try {
    const country = await prisma.countries.findFirst({
      where: {
        capitals: {
          some: {
            capital: normalCapital,
          },
        },
      },
    });

    if (!country) {
      return c.json({
        error: ERROR_MESSAGES.COUNTRY_NOT_FOUND,
      });
    }

    return c.json(country);
  } catch (error) {
    console.error("Error fetching country", error);
    return c.json({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR }, 500);
  }
});
