(() => {
  const DP = window.DTPlaybook;
  DP.nextSeasonGame = function(registry, now = new Date()) {
    if (!registry || registry.schema_version !== 1 || !Array.isArray(registry.games)) return null;
    const today = new Intl.DateTimeFormat('en-CA', {timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
    const year = Number(today.slice(0,4)) - (Number(today.slice(5,7)) < 7 ? 1 : 0);
    if (registry.season_label !== `${year}-${String(year+1).slice(2)}`) return null;
    return registry.games.filter(game => game.status === 'scheduled' && game.game_id
      && Number.isFinite(Date.parse(game.tipoff_utc)) && Date.parse(game.tipoff_utc) >= now.getTime()
      && game.opponent && ['home','away'].includes(game.home_away))
      .sort((a,b)=>Date.parse(a.tipoff_utc)-Date.parse(b.tipoff_utc))[0] || null;
  };
  DP.renderGameday = function(parent) {
    const game = DP.nextSeasonGame(DP.state.gameday);
    if (!game) return;
    const card = DP.child(parent,'section','card');
    DP.child(card,'div','dp-eyebrow',game.season_phase === 'regular' ? 'Next regular season game' : 'Next game');
    DP.child(card,'h2','dp-panel-title',`Thunder ${game.home_away === 'home' ? 'vs.' : 'at'} ${game.opponent}`);
    const time = new Intl.DateTimeFormat('en-US', {timeZone:'America/Chicago',weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'}).format(new Date(game.tipoff_utc));
    DP.child(card,'p','',time + (game.location ? ` · ${game.location}` : ''));
    if (game.tv) DP.child(card,'p','date',game.tv);
    const nba = game.links?.nba;
    if (typeof nba === 'string' && /^https:\/\/www\.nba\.com\/game\//.test(nba)) {
      const link = DP.child(card,'a','btn','NBA game page'); link.href = nba;
    }
  };
})();
