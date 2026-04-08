// .dependency-cruiser.js
module.exports = {
    options: {
        // Exclude completely removes these files/folders from the output graph.
        // We use a regex string here to match both spec files and the node_modules directory.
        exclude: {
            path: '(^|/)node_modules(/|$)|\\.spec\\.ts$',
        },

        // You can leave doNotFollow here, though exclude will essentially take precedence
        doNotFollow: {
            path: '(^|/)node_modules(/|$)',
        },

        // collapse subfolders by regex (keeping your existing setup)
        collapse: '^src/app/(auth|common|layouts)/.*',
    },
};
