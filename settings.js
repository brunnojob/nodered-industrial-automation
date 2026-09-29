module.exports = {
    flowFile: "flows/offshore-telemetry.json",
    functionGlobalContext: {
        telemetry: require("./lib/telemetry.cjs").createPipeline()
    },
    editorTheme: {
        projects: {
            enabled: false
        }
    }
}
