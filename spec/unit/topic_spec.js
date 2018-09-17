const sequelize = require("../../src/db/models/index").sequelize;
const Topic = require("../../src/db/models").Topic;
const Post = require("../../src/db/models").Post;
const User = require("../../src/db/models").User;

describe("Post", () => {

    beforeEach((done) => {
        this.topic;
        this.post;
        this.user;

        sequelize.sync({force: true}).then((res) => {

            User.create({
                email: "starman@tesla.com",
                password: "Trekkie4lyfe"
            })
            .then((user) => {
                this.user = user;
                Topic.create({
                    title: "Expeditions to Alpha Centauri",
                    description: "A compilation of reports from recent visits to the star system.",

                    posts: [{
                        title: "My first visit to Proxima Centauri b",
                        body: "I saw some rocks.",
                        userId: this.user.id
                    }]
                }, {
                    include: {
                        model: Post,
                        as: "posts"
                    }
                })
                .then((topic) => {
                    this.topic = topic;
                    this.post = topic.posts[0];
                    done();
                })
            }) 
        });
    });

    describe("#create()", () => {
        it("should create a topic object with a title, and description", (done) => {
            Topic.create({
                title: "Pros of Cryosleep during the long journey",
                description: "1. Not having to answer the 'are we there yet?' question."
            })
            .then((topic) => {
                expect(topic.title).toBe("Pros of Cryosleep during the long journey");
                expect(topic.description).toBe("1. Not having to answer the 'are we there yet?' question.");
                done();
            })
            .catch((err) => {
                console.log(err);
                done();
            })
        })
        
        it("should not create a topic with missing title or description", (done) => {
            Topic.create({
                title: "Pros of Cryosleep during the long journey."
            })
            .then((post) => {
                done();
            })
            .catch((err) => {
                expect(err.message).toContain("Topic.description cannot be null");
                done();
            })
        });
    });
    describe("#get Posts()", () => {
        it("should return an array of post objects that are associated with the topic the method was called on", (done) => {
            this.topic.getPosts()
            .then((associatedPosts) => {
                expect(associatedPosts[0].title).toBe("My first visit to Proxima Centauri b");
                expect(associatedPosts[0].body).toBe("I saw some rocks.");
                expect(associatedPosts[0].topicId).toBe(this.topic.id);
                done();
            });
        });
    })
});