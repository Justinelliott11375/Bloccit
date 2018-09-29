const User = require("./models").User;
const Post = require("./models").Post;
const Comment = require("./models").Comment;
const Favorite = require("./models").Favorite;
const bcrypt = require("bcryptjs");

module.exports = {
    createUser(newUser, callback) {
        const salt = bcrypt.genSaltSync();
        const hashedPassword = bcrypt.hashSync(newUser.password, salt);

        return User.create({
            email: newUser.email,
            password: hashedPassword
        })
        .then((user) => {
            callback(null, user);
        })
        .catch((err) => {
            callback(err);
        })
    },

    getUser(id, callback) {
        let result = {};
        User.findById(id)
        .then((user) => {
            if(!user) {
                callback(404);
            } else {
                result["user"] = user;
                Post.scope({method:          ["lastFiveFor", id]}).all()
                .then((posts) => {
                    result["posts"] = posts;
                    Comment.scope({method: ["lastFiveFor", id]}).all()
                    .then((comments) => {
                        result["comments"] = comments;
                        User.scope({method: ["favoritedPosts", id]}).all()
                        .then((favorites) => {
                            let userFavorites = JSON.parse(JSON.stringify(favorites));
                            let favoritePostsId = [];
                            userFavorites[0].favorites.forEach((favorite) => {
                                favoritePostsId.push(favorite.postId);
                            });

                            var favoritesList = [];
                            Post.findAll()
                            .then((allPosts) => {
                                allPosts.forEach((thisPost) => {
                                    if (favoritePostsId.includes(thisPost.id)) {
                                        favoritesList.push({id: thisPost.id, title: thisPost.title, topicId: thisPost.topicId});
                                    }
                                })
                                result["favoritesList"] = favoritesList;
                                callback(null, result)
                            });
                        })
                        .catch((err) => {
                            callback(err);
                        })
                    })
                })
            }
        })
    }
}