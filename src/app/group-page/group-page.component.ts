import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { GroupInterface } from '../interfaces/group-interface';
import { NgbModal, NgbModalConfig, NgbNav } from '@ng-bootstrap/ng-bootstrap';
import {e1, e2, user1, user2, user3, user4,g1, g2} from '../interfaces/testdata';
import { UserInterface } from '../interfaces/user-interface';
import { ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-group-page',
  templateUrl: './group-page.component.html',
  styleUrls: ['./group-page.component.css']
})

export class GroupPageComponent implements OnInit, AfterViewInit{
  
  @ViewChild(NgbNav) private navStuff: NgbNav | undefined;
  @ViewChild('content') private content:NgbModal | undefined; 
  chosen:GroupInterface | undefined;
  currentUser:UserInterface = user1;
  
  groups:GroupInterface[] = [g1, g2];
  constructor(private route:ActivatedRoute, config:NgbModalConfig, private modalService:NgbModal){

  }
  ngOnInit(): void {
    
  }
  ngAfterViewInit(): void {
    this.route.paramMap.subscribe(params=>{
      var id:string|null;
      id =  params.get('id');
      //should get the info here from firebase
      if(!!id)this.modalService.open(this.content);
    });
  }
  choseGroup(group:GroupInterface){
    this.chosen = group;
    this.navStuff?.select(2);
  }

  convertToListofStrings(members:UserInterface[]){
    return members.map((x)=>x.name);
  }
  
  
}
