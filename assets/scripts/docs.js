
function search_docs(data, list) {
    let find = miss = 0;
    let input = document.getElementById(`${data}`).value;
    input = input.toLowerCase();
    let x = document.getElementsByClassName(`${list}`);
    for (i = 0; i < x.length; i++) {
        if (!x[i].innerHTML.toLowerCase().includes(input)) {
            x[i].style.display = "none";
            miss++;
        } else {
            x[i].style.display = "list-item";
            find++;
        }
    }
    if (data == 'searchSelectList') {
        data = 'searchData';
    }
    if (miss > find && find == 0 && miss != 0) {
        document.getElementById(data + 'DOD').style.display = "block";
        document.querySelector('.sidebar').style.display = "none";
    } else {
        document.getElementById(data + 'DOD').style.display = "none";
        document.querySelector('.sidebar').style.display = "block";
    }
    document.getElementById("mapofcontent").innerHTML = '';
    const headingsList = generateHeadingsList();
    const htmlList = generateHtmlList(headingsList);
    document.getElementById("mapofcontent").appendChild(htmlList);
}
function generateHeadingsList() {
    const docsList = document.getElementById('docsList');
    const listItems = docsList.children;
    const headingsList = [];
    let headingId = 0;

    Array.from(listItems).forEach((listItem) => {
        if (listItem.style.display != "none") {
            const headings = listItem.querySelectorAll('h1, h2, h3, h4, h5, h6');
            const itemHeadings = [];

            Array.from(headings).forEach((heading) => {
                const tagName = heading.tagName.toLowerCase();
                const text = heading.textContent;
                const currentHeading = {
                    id: `head_${headingId}`,
                    tagName,
                    text,
                    child: [],
                };

                heading.id = `head_${headingId}`;
                headingId++;

                if (itemHeadings.length === 0) {
                    itemHeadings.push(currentHeading);
                } else {
                    let parentHeading = itemHeadings[itemHeadings.length - 1];
                    while (parentHeading && getHeadingLevel(parentHeading.tagName) >= getHeadingLevel(tagName)) {
                        parentHeading = findParentHeading(itemHeadings, parentHeading);
                    }
                    if (parentHeading) {
                        parentHeading.child.push(currentHeading);
                    } else {
                        itemHeadings.push(currentHeading);
                    }
                }
            });

            headingsList.push(...itemHeadings);
        }
    });

    return (headingsList);
}

function getHeadingLevel(tagName) {
    return parseInt(tagName.substring(1));
}

function findParentHeading(headings, currentHeading) {
    for (let i = headings.length - 1; i >= 0; i--) {
        const heading = headings[i];
        if (getHeadingLevel(heading.tagName) < getHeadingLevel(currentHeading.tagName)) {
            return heading;
        }
        if (heading.child.length > 0) {
            const parent = findParentHeading(heading.child, currentHeading);
            if (parent) {
                return parent;
            }
        }
    }
    return null;
}
function generateHtmlList(headingsList) {
    const ol = document.createElement('ol');

    function generateListItem(headings, parentOl) {
        headings.forEach((heading) => {
            const li = document.createElement('li');
            li.textContent = heading.text;
            parentOl.appendChild(li);

            const level = parseInt(heading.tagName.substring(1));
            const width = 100 - (level - 1) * 10;
            const paddingLeft = (100 - width) / 100 * 50;
            li.style.paddingLeft = `${paddingLeft}%`;
            if (level == 2) {
                li.style.marginBottom = '14px';
            }

            li.onclick = function () {
                document.getElementById(heading.id).scrollIntoView({ behavior: 'smooth' });
            }

            if (heading.child.length > 0) {
                const childOl = document.createElement('ol');
                li.appendChild(childOl);
                generateListItem(heading.child, childOl);
            }
        });
    }

    generateListItem(headingsList, ol);
    return ol;
}
const headingsList = generateHeadingsList();
const htmlList = generateHtmlList(headingsList);
document.getElementById("mapofcontent").appendChild(htmlList);
