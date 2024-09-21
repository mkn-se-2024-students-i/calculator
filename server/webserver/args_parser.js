const args = process.argv

module.exports = {
    hasArg: (arg) => args.includes(arg),
    argParams: (arg, cnt) => {
        var t = args.findIndex(it => it == arg)
        if (t == -1 || t + cnt + 1 >= args.length) {
            return undefined
        }
        return args.slice(t + 1, t + cnt + 1)
    }
}
