module.exports = {
    init(app){
        const staticRoutes = require("../routes/static");
        const topicRoutes = require("../routes/topics");
        const adRoutes = require("../routes/ads")

        app.use(staticRoutes);
        app.use(topicRoutes);
        app.use(adRoutes);
    }
}