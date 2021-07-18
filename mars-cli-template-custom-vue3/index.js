const fse = require("fs-extra");
const inquirer = require("inquirer");
const glob = require("glob");
const ejs = require("ejs");

async function install(options) {
    const projectPromt = [];
    const descriptionPromt = {
        type: "input",
        name: "description",
        message: "请输入项目描述信息",
        default: "",
        validate: function(v){
            // 首字符必须是字母
            // 尾字符必须为字母和数字、不能为字符
            // 字符仅允许-_
            var done = this.async();
            setTimeout(function() {
                if (!v) {
                    done('项目描述信息不能为空');
                    return;
                }
                done(null, true);
            }, 0);
        }
    };
    projectPromt.push(descriptionPromt);
    const projectInfo = await inquirer.prompt(projectPromt);
    options.projectInfo.description = projectInfo.description;
    const {sourcePath, targetPath} = options;
    try {
        fse.ensureDirSync(sourcePath);
        fse.ensureDirSync(targetPath);
        fse.copySync(sourcePath, targetPath);
    } catch (e) {
        throw e;
    } finally {
        // spinner.stop(true);
    }

    const templateIgnore = options.templateInfo.ignore || [];
    const ignore = ['**/node_modules/**', ...templateIgnore];
    await ejsRender({
        ignore,
        targetPath,
        data: options.projectInfo
    });
}

async function ejsRender (options) {
    const dir = options.targetPath;
    const projectInfo = options.data;
    return new Promise((resolve, reject) => {
        glob("**", {
            cwd: dir,
            ignore: options.ignore,
            nodir: true
        }, (err, files) => {
            if (err) reject(err);
            Promise.all(files.map(file => {
                const filePath = path.resolve(dir, file);
                return new Promise((resolve1, reject1) => {
                    ejs.renderFile(filePath, projectInfo, {}, (err, result) => {
                        if (err) reject1(err);
                        else {
                            fse.writeFileSync(filePath, result);
                            resolve1(result);
                        }
                    });
                });
            })).then(() => {
                resolve();
            }).catch(err => {
                reject(err);
            });
        });
    });
}


module.exports = install;
