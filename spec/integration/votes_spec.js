const request = require("request");
const server = require("../../src/server");
const base = "http://localhost:3000/topics/";

const sequelize = require("../../src/db/models/index").sequelize;
const Topic = require("../../src/db/models").Topic;
const Post = require("../../src/db/models").Post;
const User = require("../../src/db/models").User;
const Vote = require("../../src/db/models").Vote;

describe("routes : votes", () => {

    beforeEach((done) => {

        this.user;
        this.topic;
        this.post;
        this.vote;

        sequelize.sync({force: true}).then((res) => {
            User.create({
                email: "starman@tesla.com",
                password: "Trekkie4lyfe"
            })
            .then((res) => {
                this.user = res;

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
                .then((res) => {
                    this.topic = res;
                    this.post = this.topic.posts[0];
                    done();
                })
                .catch((err) => {
                    console.log(err);
                    done();
                });
            });
        });
    });

    describe("guest attempting to vote on a post", () => {

        beforeEach((done) => {    
            request.get({
                url: "http://localhost:3000/auth/fake",
                form: {
                    userId: 0 // ensure no user in scope
                }
            },
            (err, res, body) => {
                done();
            });
        });
   
        describe("GET /topics/:topicId/posts/:postId/votes/upvote", () => {
   
            it("should not create a new vote", (done) => {
                const options = {
                    url: `${base}${this.topic.id}/posts/${this.post.id}/votes/upvote`
                };
                request.get(options, (err, res, body) => {
                    Vote.findOne({
                        where: {
                            userId: this.user.id,
                            postId: this.post.id
                        }
                    })
                    .then((vote) => {
                        expect(vote).toBeNull();
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

    describe("signed in user voting on a post", () => {

        beforeEach((done) => {  
            request.get({       
                url: "http://localhost:3000/auth/fake",
                form: {
                    role: "member", 
                    userId: this.user.id
                }
            },
            (err, res, body) => {
                done();
            });
        });
   
        describe("GET /topics/:topicId/posts/:postId/votes/upvote", () => {
   
            it("should create an upvote", (done) => {
                const options = {
                    url: `${base}${this.topic.id}/posts/${this.post.id}/votes/upvote`
                };
                request.get(options, (err, res, body) => {
                    Vote.findOne({          
                        where: {
                            userId: this.user.id,
                            postId: this.post.id
                        }
                    })
                    .then((vote) => {               // confirm that an upvote was created
                        expect(vote).not.toBeNull();
                        expect(vote.value).toBe(1);
                        expect(vote.userId).toBe(this.user.id);
                        expect(vote.postId).toBe(this.post.id);
                        done();
                    })
                    .catch((err) => {
                        console.log(err);
                        done();
                    });
                });
            });

            it("should unsuccessfully attempt to create an upvote with a value of 2", (done) => {
                Vote.create({
                    value: 2,
                    postId: this.post.id,
                    userId: this.user.id
                })
                .then((vote) => {
                    // should not execute, specs are in .catch()
                    done();
                })
                .catch((err) => {
                    expect(err.message).toContain("Validation isIn on value failed");
                    done();
                });
            });
        });
   
        describe("GET /topics/:topicId/posts/:postId/votes/downvote", () => {
   
            it("should create a downvote", (done) => {
                const options = {
                url: `${base}${this.topic.id}/posts/${this.post.id}/votes/downvote`
                };

                request.get(options, (err, res, body) => {
                    Vote.findOne({
                        where: {
                            userId: this.user.id,
                            postId: this.post.id
                        }
                    })
                    .then((vote) => {
                        expect(vote).not.toBeNull();
                        expect(vote.value).toBe(-1);
                        expect(vote.userId).toBe(this.user.id);
                        expect(vote.postId).toBe(this.post.id);
                        done();
                    })
                    .catch((err) => {
                        console.log(err);
                        done();
                    });
                });
            });

            it("should unsuccessfully create a second downvote", (done) => {
                const options = {
                url: `${base}${this.topic.id}/posts/${this.post.id}/votes/downvote`
                };

                //create new post and associated new downvote

                Post.create({ 
                    title: "Sample post 2",
                    body: "Description for sample post 2.",
                    topicId: this.topic.id,
                    userId: this.user.id,
                    votes: [{
                        value: -1,
                        postId: 2,
                        userId: this.user.id
                    }]
                }, {
                    include: {
                    model: Vote,
                    as: "votes"
                    }
                })
                .then((res) => {

                    this.post = res;
                    this.vote = this.post.votes[0];
                    this.topic.posts[1] = res;

                    // check to ensure that first vote is created
                    expect(this.vote).not.toBeNull();
                    expect(this.vote.value).toBe(-1);
                    expect(this.vote.userId).toBe(this.user.id);
                    expect(this.vote.postId).toBe(2);

                    // attempt to create a second downvote
                    request.get(options, (err, res, body) => {
                        Post.findOne({
                            where: {
                                title: "Sample post 2"
                            }
                        })
                        .then((post) => {
                            //console.log(this.post.title);
                            //console.log(this.post.votes.length);

                            //check that second downvote was not created
                            expect(this.post.getPoints()).toBe(-1);
                            expect(this.post.getPoints()).not.toBe(-2);
                            done();
                        })
                        .catch((err) => {
                            console.log(err);
                            done();
                        })
                    });
                })
            });
        });
    }); 

    describe("getting points associated with a post via the getPoints() method", () => {
        it("should create a post then successfully call the getPoints() method on it", (done) => {
            Post.create({ 
                title: "Sample post 3",
                body: "Description for sample post 3.",
                topicId: this.topic.id,
                userId: this.user.id,
                votes: [{
                    value: 1,
                    postId: 3,
                    userId: this.user.id
                }]
            }, {
                include: {
                model: Vote,
                as: "votes"
                }
            })
            .then((res) => {

                this.post = res;
                this.vote = this.post.votes[0];
                this.topic.posts[1] = res;
                expect(this.post.getPoints()).toBe(1);
                done();
            });
        })
    });

    describe("using hasUpvoteFor() and hasDownvoteFor() methods", () => {
        it("should create a post then successfully call the hasUpvotefor() method to see if the user passed has an upvote for the post ", (done) => {
            Post.create({ 
                title: "Sample post 4",
                body: "Description for sample post 4.",
                topicId: this.topic.id,
                userId: this.user.id,
                votes: [{
                    value: 1,
                    postId: 4,
                    userId: this.user.id
                }]
            }, {
                include: {
                model: Vote,
                as: "votes"
                }
            })
            .then((res) => {

                this.post = res;
                this.vote = this.post.votes[0];
                this.topic.posts[1] = res;
                //console.log(this.post.hasUpvoteFor(this.user.id));
                expect(this.post.hasUpvoteFor(this.user.id)).toBe(true);
                done();
            });
        })

        it("should create a post then successfully call the hasDownvotefor() method to see if the user passed has a downvote for the post ", (done) => {
            Post.create({ 
                title: "Sample post 4",
                body: "Description for sample post 4.",
                topicId: this.topic.id,
                userId: this.user.id,
                votes: [{
                    value: -1,
                    postId: 4,
                    userId: this.user.id
                }]
            }, {
                include: {
                model: Vote,
                as: "votes"
                }
            })
            .then((res) => {

                this.post = res;
                this.vote = this.post.votes[0];
                this.topic.posts[1] = res;
                //console.log(this.post.hasDownvoteFor(this.user.id));
                expect(this.post.hasDownvoteFor(this.user.id)).toBe(true);
                done();
            });
        })
    });
});