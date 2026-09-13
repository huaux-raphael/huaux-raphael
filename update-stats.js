const fs = require("fs");

const username = "huaux-raphael";
const token = process.env.GITHUB_TOKEN;

async function github(url) {
    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json"
        }
    });

    if (!response.ok) {
        throw new Error(
            `GitHub API error: ${response.status} ${response.statusText}`
        );
    }

    return response.json();
}

async function getRepos() {
    let repos = [];
    let page = 1;

    while (true) {
        const result = await github(
            `https://api.github.com/users/${username}/repos?per_page=100&page=${page}`
        );

        repos.push(...result);

        if (result.length < 100) break;

        page++;
    }

    return repos;
}

async function getCommits() {
    try {
        const result = await github(
            `https://api.github.com/search/commits?q=author:${username}`
        );

        return result.total_count ?? 0;
    } catch {
        return 0;
    }
}

function replaceSVGText(svg, id, value) {
    const regex = new RegExp(
        `(<text[^>]*id="${id}"[^>]*>)[\\s\\S]*?(</text>)`
    );

    return svg.replace(regex, `$1${value}$2`);
}

async function main() {
    const user = await github(
        `https://api.github.com/users/${username}`
    );

    const repos = await getRepos();

    const repositories = user.public_repos;

    const stars = repos.reduce(
        (total, repo) => total + repo.stargazers_count,
        0
    );

    const followers = user.followers;

    const commits = await getCommits();

    console.log("GitHub Stats");
    console.log("----------------");
    console.log(`Repositories: ${repositories}`);
    console.log(`Stars:        ${stars}`);
    console.log(`Commits:      ${commits}`);
    console.log(`Followers:    ${followers}`);

    let svg = fs.readFileSync("profile.svg", "utf8");

    svg = replaceSVGText(svg, "repositories", repositories);
    svg = replaceSVGText(svg, "stars", stars);
    svg = replaceSVGText(svg, "commits", commits);
    svg = replaceSVGText(svg, "followers", followers);

    fs.writeFileSync("profile.svg", svg);
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
