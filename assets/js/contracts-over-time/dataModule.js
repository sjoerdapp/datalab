const dataModule = (function() {
  const mem = {
    awardsByYear: null,
    weeklyTotals: null,
    weeklyAverages: null,
    parallaxStatus: "pre", // "pre" || "post" || "active"
    activePanel: { id: null }
  };

  function loadAwardsByYear(cb) {
    d3.json(
      "../../../data-lab-data/contracts-over-time/1_TotalContractAwardsbyYear.json",
      function(error, data) {
        if (error) throw error;
        mem.awardsByYear = data;
        if (cb) cb(data);
      }
    );
  }

  function loadWeeklyTotals(cb) {
    d3.json(
      "../../../data-lab-data/contracts-over-time/2_WeeklyDataTotals.json",
      function(error, data) {
        if (error) throw error;
        mem.weeklyTotals = data;
        if (cb) cb(data);
      }
    );
  }

  function loadWeeklyAverages(cb) {
    d3.json(
      "../../../data-lab-data/contracts-over-time/3_WeeklyAverageSpending.json",
      function(error, data) {
        if (error) throw error;
        mem.weeklyAverages = data;
        if (cb) cb(data);
      }
    );
  }

  return {
    loadAwardsByYear,
    loadWeeklyTotals,
    loadWeeklyAverages,
    mem
  };
})();
