import { Injectable } from '@angular/core';
import { AuthenticationService } from "../network/firebase/authentication/authentication.service"
import { GroupService } from "../network/firebase/firestore/group.service"
import { UserInterface } from "../interfaces/user-interface"
import { GroupInterface } from "../interfaces/group-interface"
import { CalendarService } from '../network/firebase/firestore/calendar.service';
import { PlatformLocation } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { CalanderEvent } from "../interfaces/calander-interface/CalanderEvent-interface"
import { NgbDate } from '@ng-bootstrap/ng-bootstrap';
import { CalanderColor, CalanderType, CalanderTypeColor, CalanderTypePriority } from '../interfaces/enums/calenderenum';
import { Clipboard } from '@angular/cdk/clipboard';

@Injectable({
  providedIn: 'root'
})
export class ViewGroupFacade {

  	currentUser?: UserInterface;
    group$: BehaviorSubject<GroupInterface|undefined> = new BehaviorSubject<GroupInterface|undefined>(undefined);
    dateColor$: BehaviorSubject<[[NgbDate,NgbDate], CalanderColor][]> = new BehaviorSubject<[[NgbDate,NgbDate], CalanderColor][]>([]); //should be date range better // wtf does this mean
    groupCalendar$: BehaviorSubject<CalanderEvent[]> = new BehaviorSubject<CalanderEvent[]>([]);
    adminGroups$: BehaviorSubject<GroupInterface[]> = new BehaviorSubject<GroupInterface[]>([]);
    memberGroups$: BehaviorSubject<GroupInterface[]> = new BehaviorSubject<GroupInterface[]>([]);
    groupById$: BehaviorSubject<GroupInterface|undefined> = new BehaviorSubject<GroupInterface|undefined>(undefined);

    constructor(
        private authSvc:AuthenticationService, 
        private calSvc: CalendarService,
        private clipboard:Clipboard,
        private grpSvc: GroupService,
        private platformLocation: PlatformLocation,
    ) {

    this.authSvc.getCurrentUser().then(user=>{
		this.currentUser = user;

        this.grpSvc.getGroups(user).subscribe(grps=>{
            let adm: GroupInterface[] = [];
            let nadm: GroupInterface[] = [];
            grps.forEach(grp=>{
                if (grp.admin.id === user.id)
                    adm.push(grp);
                else 
                    nadm.push(grp);
            });
            
            this.adminGroups$.next(adm);
            this.memberGroups$.next(nadm);
        })
    });
  }

    init(group: GroupInterface){

        // Get latest group
        this.grpSvc.getGroupById(group.id).subscribe(group=>{
            this.group$.next(group);
            // Get group calendar
            this.calSvc.getGroupCalendar(group).subscribe(grpCal=>{
                grpCal.sort((a,b)=>{//sort by time then sort by calanderType, Booked for event is the highest priority
                    if(a.start < b.start) return -1;
                    else if(a.start==b.start){
                      var aNum:number = CalanderTypePriority.get(a.type)||0;
                      var bNum:number = CalanderTypePriority.get(b.type)||0;
                      return bNum-aNum;
                    }
                    return 1;
                });

                let start: NgbDate = new NgbDate(group.event.startDate!.getFullYear(), group.event.startDate!.getMonth()+1, group.event.startDate!.getDate()); 
                let end:NgbDate = new NgbDate(group.event.endDate!.getFullYear(), group.event.endDate!.getMonth()+1, group.event.endDate!.getDate()); 
                let dateColor: [[NgbDate,NgbDate], CalanderColor][] = [[[start, end], this.setColor()]]

                this.dateColor$.next(dateColor);
                this.groupCalendar$.next(grpCal);
            });
        });
    }

    setColor():CalanderColor{
        if(this.groupCalendar$.value.length==0) return CalanderColor.AllAvailable;
        
        var cmiCount = [...new Set(this.groupCalendar$.value.map(i=>i.user.id))].length;
        if (cmiCount==this.group$.value!.members.length)return CalanderColor.NotFreeAtAll
        return CalanderColor.SomeFree
        
    }

    copyInviteLink() {
        var base_url = (this.platformLocation as any)._location.origin+"/group"+"/"+this.group$.value!.id;
        this.clipboard.copy(base_url);
    }

    deleteGroup(): Promise<void> {
        return this.grpSvc.deleteGroup(this.group$.value!);
    }

    kickUser(user: UserInterface): Promise<void> {
        return this.grpSvc.removeFromGroup(this.group$.value!, user);
    }

    joinGroup(id: string): Promise<void> {
        return this.grpSvc.joinGroup(id, this.currentUser!);
    }

    getStartDate(d?: Date): NgbDate{
        if (!d)
            d = new Date();
        return new NgbDate(d.getFullYear(), d.getMonth()+1, d.getDate());
    }

    getGrpById(id: string): Observable<GroupInterface>{
        let obs: Observable<GroupInterface> = this.grpSvc.getGroupById(id);
        obs.subscribe(grp=>{
            this.groupById$.next(grp);
        });
        return obs;
    }
	
}