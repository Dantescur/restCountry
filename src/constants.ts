import type { Prisma } from "@prisma/client";

export type Variables = {
  fieldsModified: boolean;
  queryOptions: Prisma.countriesFindManyArgs;
  paginationMeta: {
    page: number;
    limit: number;
  };
};

export const validFields = [
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

export const defaultIncludes = {
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

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;

export const ERROR_MESSAGES = {
  INVALID_FIELDS: "Invalid fields requested.",
  MISSING_PARAMETER: "Missing parameter:",
  COUNTRY_NOT_FOUND: "Country not found.",
  CURRENCY_NOT_FOUND: "Currency not found.",
  LANGUAGE_NOT_FOUND: "Language not found.",
  INTERNAL_SERVER_ERROR: "Internal server error.",
};
