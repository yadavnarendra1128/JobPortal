import React, { useEffect, useState } from "react";
import Navbar from "./shared/Navbar";
import FilterCard from "./FilterCard";
import Job from "./Job";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";

const Jobs = () => {
  const { allJobs, searchedQuery } = useSelector((store) => store.job);
  const [filterJobs, setFilterJobs] = useState(allJobs);
  const salaryRanges = {
    "0-30k": [0, 30000],
    "30-60k": [30000, 60000],
    "60k-1LPA": [60000, 100000],
    "1LPA above": [100000, Infinity],
  };
  useEffect(() => {
    if (searchedQuery) {
      if (searchedQuery in salaryRanges) {
        const [minSalary, maxSalary] = salaryRanges[searchedQuery];
        const filteredJobs = allJobs.filter((job) => {
          const salary = parseInt(job.salary); 
          return salary >= minSalary && salary <= maxSalary;
        });
        setFilterJobs(filteredJobs);
      } else {
        const filteredJobs = allJobs.filter((job) => {
          return (
            job.title.toLowerCase().includes(searchedQuery.toLowerCase()) ||
            job.description
              .toLowerCase()
              .includes(searchedQuery.toLowerCase()) ||
            job.location.toLowerCase().includes(searchedQuery.toLowerCase())
          );
        });
        setFilterJobs(filteredJobs);
      }
    } else {
      setFilterJobs(allJobs);
    }
  }, [allJobs, searchedQuery]);
  console.log(filterJobs);

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto mt-5">
        <div className="flex gap-5">
          <div className="w-20%">
            <FilterCard />
          </div>
          {filterJobs.length <= 0 ? (
            <span>Job not found</span>
          ) : (
            <div className="flex-1 h-[88vh] overflow-y-auto pb-5">
              <div className="grid grid-cols-3 gap-4">
                {filterJobs.map((job) => (
                  <motion.div
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.3 }}
                    key={job?._id}
                  >
                    <Job job={job} />
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Jobs;
