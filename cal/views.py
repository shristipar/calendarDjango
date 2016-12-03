from django.shortcuts import render
from django.http import HttpResponse,JsonResponse
from cal.models import Event
from datetime import datetime

from django.http import Http404  

from django.http import QueryDict

# Create your views here.
def index(request):
    import datetime
    today = datetime.date.today()
    
    return render(request, 'cal/index.html', {})



def getevents(request,month,year):
    response={}
    response['success']=False
    month=int(month)
    year=int(year)
    if month<1 or month>12:
        response['message']="Invalid Month"
    elif year<1900 or year>2100:
        response['message']="Year data not available"
    else:
        response["message"]="Done"
        response["success"]=True
        curr = datetime.now()
        import calendar
        (a,b) = calendar.monthrange(year,month)
        fd=datetime(year,month,1,0,0,0,0,curr.tzinfo)
        ld=datetime(year,month,b,23,59,59,0,curr.tzinfo)
        queryresult=Event.objects.filter(start_datetime__range = (fd,ld)).order_by("start_datetime").values('id','name','location','start_datetime','end_datetime','allday','description','synced')
        
        response['data']=list(queryresult)
    return JsonResponse(response,safe=False)



def addevent(request):
    if request.method == "POST":
        req_name=request.POST.get('name',"")
        req_location=request.POST.get('location',"")
        
        curr = datetime.utcnow()
        req_start=request.POST.get('start_datetime',datetime.today())
        req_start = datetime.strptime(req_start, "%Y-%m-%dT%H:%M:%S.%fZ")
        req_start = req_start.replace(tzinfo = curr.tzinfo)
    
        req_end=request.POST.get('end_datetime',datetime.today())
        req_end = datetime.strptime(req_end,"%Y-%m-%dT%H:%M:%S.%fZ")
        req_end = req_end.replace(tzinfo = curr.tzinfo)
        
        req_allday= request.POST.get('allday') == 'true'
        req_desc=request.POST.get('description',"")
        
        if not "type" in request.POST:
            return JsonResponse({"success":False, "message":"Paramter Missing"})
    
        if request.POST["type"]=="add":
            Event.objects.create(name = req_name,
                             location = req_location,
                             start_datetime = req_start,
                             end_datetime = req_end,
                             allday = req_allday,
                             description = req_desc)
            
        elif request.POST["type"]=="edit":
            #check id exts in post
            
            eid = request.POST['eid']
            old = Event.objects.get(id=eid)
            old.name = req_name
            old.location=req_location
            old.start_datetime=req_start
            old.end_datetime=req_end
            old.allday=req_allday
            old.description= req_desc
            old.save()
        else:
            return JsonResponse({"success":False, "message": "wrong action"})
        
        return JsonResponse({"success":True})
    else:
        raise Http404
        
def delevent(request):
    if request.method == "DELETE":
        delete = QueryDict(request.body)
        eid = delete['eid']
        Event.objects.filter(id=eid).delete()
        return JsonResponse({"success": True,
                             "type": "delete",
                             "eid": eid})
    else:
        raise Http404
        
def addsynced(request):
    if request.method== "POST":
        eid=request.POST["eid"]
        obj=Event.objects.get(id=eid)
        obj.synced=True
        obj.save()
        return JsonResponse({"success":True,"type":"synced","eid":eid})
    else:
        raise Http404
        
    