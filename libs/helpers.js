exports.formatString = function(string) {
    if (string !== undefined) {
        return new RegExp('^' + string.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + '$', "i");
    }
    return ';'
};