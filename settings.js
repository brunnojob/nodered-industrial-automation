module.exports = {
  flowFile: "flows/offshore-telemetry.json",
  functionGlobalContext: {
    telemetry: require("./lib/telemetry.cjs").createPipeline(),
    archive: new (require("./lib/archive.cjs").Archive)(
      process.env.ARCHIVE_DIRECTORY || ".local/archive",
      process.env.BRUNNODEV_API_URL ||
        "https://vercel-home-telemetry-api.vercel.app/api/runs",
      process.env.BRUNNODEV_ACCESS_TOKEN,
    ),
  },
  editorTheme: {
    projects: {
      enabled: false,
    },
  },
};
