const path = require('path');

// multiple entry and output source - https://stackoverflow.com/questions/35903246/how-to-create-multiple-output-paths-in-webpack-config
module.exports = {
    entry: {
        './client/components/basic/index': './client/components/basic/index.js',
        './client/components/loadmore/index': './client/components/loadmore/index.js',
        './client/components/pagination/index': './client/components/pagination/index.js',
        './client/components/table_form/index': './client/components/table_form/index.js',
        './client/components/products_server_side_table/index': './client/components/products_server_side_table/index.js',
    },
    output: {
        filename: '[name].js',  // output bundle file name
        path: path.resolve(__dirname, './static'),  // path to our Django static directory
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                loader: "babel-loader",
                options: {
                    presets: ["@babel/preset-env", "@babel/preset-react"],
                }
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ]
    }
};