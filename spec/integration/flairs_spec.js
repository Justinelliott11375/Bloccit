const request = require("request");
const server = require("../../src/server");
const base = "http://localhost:3000/topics";

const sequelize = require("../../src/db/models/index").sequelize;
const Topic = require("../../src/db/models").Topic;
const Post = require("../../src/db/models").Post;
const Flair = require("../../src/db/models").Flair;
const User = require("../../src/db/models").User;

describe("routes : flairs", () => {

    beforeEach((done) => {
        this.topic;
        this.post;
        this.user;
        this.flair;

        sequelize.sync({force: true}).then((res) => {

            User.create({
                email: "starman@tesla.com",
                password: "Trekkie4lyfe",
                role: "admin"
            })
            .then((user) => {
                request.get({
                    url: "http://localhost:3000/auth/fake",
                    form: {
                        role: user.role, 
                        userId: user.id,
                        email: user.email
                    }
                },
                    (err, res, body) => {
                      done();
                    }
                );
            
                Topic.create({
                    title: "Flair Test Topic",
                    description: "Topic for flair test implementation.",
                    posts: [{
                        title: "Flair Test Post",
                        body: "test testy test test!",
                        userId: user.id,
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
                
                    Flair.create({
                        name: "Flair 1: blue",
                        color: "Blue",
                        topicId: this.topic.id,
                        postId: this.post.id,
                        userId: user.id
                    })
                    .then((flair) => {
                        this.flair = flair;
                        done();
                    })
            
                    .catch((err) => {
                        console.log(err);
                        done();
                    });
                });
            });
        });
    });

    describe("GET /posts/:postId/flairs/new", () => {

        it("should render a new flair form", (done) => {
            request.get(`${base}/${this.topic.id}/posts/${this.post.id}/flairs/new`, (err, res, body) => {
                expect(err).toBeNull();
                expect(body).toContain("New Flair");
                done();
            });
        });
    });    

    describe("POST /posts/:postId/flairs/create", () => {

        it("should create a new flair and redirect", (done) => {
            const options = {
                url: `${base}/${this.topic.id}/posts/${this.post.id}/flairs/create`,
                form: {
                    name: "Flair 2: red",
                    color: "Red",
                    userId: 1
                }
            };
            request.post(options, (err, res, body) => {
    
                Flair.findOne({where: {name: "Flair 2: red"}})
                .then((flair) => {
                    expect(flair).not.toBeNull();
                    expect(flair.name).toBe("Flair 2: red");
                    expect(flair.color).toBe("Red");
                    expect(flair.topicId).not.toBeNull();
                    done();
                })
                .catch((err) => {
                    console.log(err);
                    done();
                });
            });
        });       
    });
    
    describe("GET /posts/:postId/flairs/:id", () => {
        it("should render a view with the selected flair", (done) => {
            request.get(`${base}/${this.topic.id}/posts/${this.post.id}/flairs/${this.flair.id}`, (err, res, body) => {
                expect(err).toBeNull();
                expect(body).toContain("Blue");
                done();
            });
        });
    });

    describe("POST /posts/:tpostId/flairs/:id/destroy", () => {
        it("should delete the flair with the associated ID", (done) => {
            expect(this.flair.id).toBe(1);

            request.post(`${base}/${this.topic.id}/posts/${this.post.id}/flairs/${this.flair.id}/destroy`, (err, res, body) => {
                Flair.findById(1)
                .then((flair) => {
                    expect(err).toBeNull();
                    expect(flair).toBeNull();
                    done();
                })
            });
        });
    });

    describe("GET /posts/:postId/flairs/:id/edit", () => {
        it("should render a view with an edit flair form", (done) => {
            request.get(`${base}/${this.topic.id}/posts/${this.post.id}/flairs/${this.flair.id}/edit`, (err, res,     body) => {
                expect(err).toBeNull();
                expect(body).toContain("Edit Flair");
                expect(body).toContain("Blue");
                done();
            });
        });
    });

    describe("POST /posts/:postId/flairs/:id/update", () => {

        it("should return a status code 302", (done) => {
            request.post({
                url: `${base}/${this.topic.id}/posts/${this.post.id}/flairs/${this.flair.id}/update`,
                form: {
                    name: "Flair 3: orange",
                    color: "Orange",
                }
            }, (err, res, body) => {
                expect(res.statusCode).toBe(302);
                done();
            });
        });
    
        it("should update the flair with the given values", (done) => {
            const options = {
                url: `${base}/${this.topic.id}/posts/${this.post.id}/flairs/${this.flair.id}/update`,
                form: {
                    name: "Flair update"
                }
            };
            request.post(options,
                (err, res, body) => {
    
                expect(err).toBeNull();
    
                Flair.findOne({
                where: {id: this.flair.id}
                })
                .then((flair) => {
                    expect(flair.name).toBe("Flair update");
                    done();
                });
            });
        });
    });
});