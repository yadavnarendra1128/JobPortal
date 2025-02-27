import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { Bookmark } from 'lucide-react'
import { Avatar, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { APPLICATION_API_END_POINT, } from "@/utils/constant";
import { toast } from "sonner";
import { setSingleJob } from "@/redux/jobSlice";
import axios from 'axios'

const Job = ({job}) => {
    const {singleJob} = useSelector(store => store.job);

    const navigate = useNavigate();
    const { user } = useSelector((store) => store.auth);
  const isIntiallyApplied = job?.applications?.some(application => application.applicant === user?._id) || false;
      
    const dispatch = useDispatch();
        const [isApplied, setIsApplied] = useState(isIntiallyApplied);

    useEffect(()=>{
        setIsApplied(job.applications.some(application=>application.applicant === user?._id))
    },[])
    const daysAgoFunction = (mongodbTime) => {
        const createdAt = new Date(mongodbTime);
        const currentTime = new Date();
        const timeDifference = currentTime - createdAt;
        return Math.floor(timeDifference/(1000*24*60*60));
    }

    const applyJobHandler = async () => {
      try {
        const res = await axios.get(
          `${APPLICATION_API_END_POINT}/apply/${job._id}`,
          { withCredentials: true }
        );

        if (res.data.success) {
          setIsApplied(true); // Update the local state
          const updatedSingleJob = {
            ...singleJob,
            applications: [...singleJob.applications, { applicant: user?._id }],
          };
          dispatch(setSingleJob(updatedSingleJob)); // helps us to real time UI update
          toast.success(res.data.message);
        }
      } catch (error) {
        console.log(error);
        toast.error(error.response.data.message);
      }
    };
    
    return (
        <div className='p-5 rounded-md shadow-xl bg-white border border-gray-100'>
            <div className='flex items-center justify-between'>
                <p className='text-sm text-gray-500'>{daysAgoFunction(job?.createdAt) === 0 ? "Today" : `${daysAgoFunction(job?.createdAt)} days ago`}</p>
                <Button variant="outline" className="rounded-full" size="icon"><Bookmark /></Button>
            </div>

            <div className='flex items-center gap-2 my-2'>
                <Button className="p-6" variant="outline" size="icon">
                    <Avatar>
                        <AvatarImage src={job?.company?.logo} />
                    </Avatar>
                </Button>
                <div>
                    <h1 className='font-medium text-lg'>{job?.company?.name}</h1>
                    <p className='text-sm text-gray-500'>India</p>
                </div>
            </div>

            <div>
                <h1 className='font-bold text-lg my-2'>{job?.title}</h1>
                <p className='text-sm text-gray-600'>{job?.description}</p>
            </div>
            <div className='flex items-center gap-2 mt-4'>
                <Badge className={'text-blue-700 font-bold'} variant="ghost">{job?.position} Positions</Badge>
                <Badge className={'text-[#F83002] font-bold'} variant="ghost">{job?.jobType}</Badge>
                <Badge className={'text-[#7209b7] font-bold'} variant="ghost">{job?.salary}LPA</Badge>
            </div>
            <div className='flex items-center gap-4 mt-4'>
                <Button onClick={()=> navigate(`/description/${job?._id}`)} variant="outline">Details</Button>
                <Button
                                onClick={isApplied ? null : applyJobHandler}
                                    disabled={isApplied}
                                    className={`rounded-lg ${isApplied ? 'bg-purple-700 cursor-not-allowed' : 'bg-[#7209b7] hover:bg-[#5f32ad]'}`}>
                                    {isApplied ? 'Applied' : 'Apply Now'}
                                </Button>
            </div>
        </div>
    )
}

export default Job