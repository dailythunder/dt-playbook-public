const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
class Element {
  constructor(tag){this.tagName=tag;this.children=[];this.style={};this.handlers={};this.className='';this.textContent='';
    this.classList={add:(...names)=>{this.className=[...new Set([...this.className.split(' '),...names])].join(' ').trim();},remove:(...names)=>{this.className=this.className.split(' ').filter(n=>!names.includes(n)).join(' ');}};}
  appendChild(child){this.children.push(child);return child;}
  replaceChildren(...children){this.children=children;}
  addEventListener(name,fn){this.handlers[name]=fn;}
  setAttribute(name,value){this[name]=value;}
}
const root=new Element('div'),batch=new Element('span');
const ctx={window:{},document:{getElementById:id=>id==='daily-product-root'?root:batch,createElement:tag=>new Element(tag)},Date,Set,Math,setInterval:()=>1,clearInterval:()=>{}};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('playbook/assets/daily-product-core.js','utf8'),ctx);
const DP=ctx.window.DTPlaybook;
['renderLookback','renderArticle','renderPlayNext'].forEach(name=>DP[name]=()=>{});
DP.state.days=[{date:'2026-10-13',modules:{article:{article_title:'Archive story'}}}];
DP.state.notice='Showing the most recent released day.';
DP.render();
assert.equal(root.children.length,3);
assert.equal(root.children[0].style.gridColumn,'1 / -1');
assert.equal(root.children[1].tagName,'aside');
assert.equal(root.children[2].className,'dp-main');
DP.state.notice='';DP.render();assert.equal(root.children.length,2);

vm.runInContext(fs.readFileSync('playbook/assets/daily-product-shaisweeper.js','utf8'),ctx);
const puzzle=JSON.parse(fs.readFileSync('tests/fixtures/reviewed-shaisweeper-public.json','utf8'));
assert.equal(puzzle.game_id,'0022500064');
assert.equal(puzzle.rows,9);assert.equal(puzzle.cols,12);assert.equal(puzzle.fgm,12);assert.equal(puzzle.bombs,12);
const idCoords=puzzle.cell_ids.map(cell=>`${Number(cell.slice(1))-1},${cell.charCodeAt(0)-65}`).sort();
assert.deepEqual(idCoords,puzzle.mine_cells.map(cell=>cell.join(',')).sort());
assert.deepEqual(puzzle.cell_ids,puzzle.fg_cell_ids);
const container=new Element('section');DP.renderShaiSweeper(container,puzzle);
function all(node,cls){return [...(node.className.split(' ').includes(cls)?[node]:[]),...node.children.flatMap(child=>all(child,cls))];}
const grid=all(container,'shai-grid')[0];
assert.ok(grid);assert.equal(grid.children.length,108);assert.equal(grid.style.gridTemplateColumns,'repeat(12, 1fr)');
const [row,col]=puzzle.mine_cells[0];grid.children[row*12+col].handlers.click();
assert.equal(all(container,'shai-status')[0].textContent,'Hit a made shot.');
assert.equal(grid.children.filter(cell=>cell.textContent==='●').length,12);
all(container,'shai-reset')[0].handlers.click();
assert.equal(grid.children.filter(cell=>cell.textContent==='●').length,0);
assert.equal(grid.children.length,108);
console.log('Layout span and real 9x12 ShaiSweeper play/reset contracts passed');
