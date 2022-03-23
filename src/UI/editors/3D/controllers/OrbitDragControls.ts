import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { DragControls } from 'three/examples/jsm/controls/DragControls'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls'

type Camera =  THREE.PerspectiveCamera | THREE.OrthographicCamera;

//Thanks https://sbcode.net/threejs/multi-controls-example/#video-lecture
export class OrbitDragControls{
    public dragControls: DragControls;
    public orbitControls:  OrbitControls;

    constructor(objects: THREE.Object3D[], camera: Camera, domElem: HTMLElement){
        this.dragControls = new DragControls(objects, camera, domElem);
        this.orbitControls = new OrbitControls(camera, domElem);


        this.dragControls.addEventListener('dragstart', (event) => {
            this.orbitControls.enabled = false
            event.object.material.opacity = 0.33
            console.log(event);
        })
        this.dragControls.addEventListener('dragend', (event) => {
            this.orbitControls.enabled = true
            event.object.material.opacity = 1
        })
    }

    public dispose(){
        this.dragControls.dispose();
        this.orbitControls.dispose();
    }

    public getTarget(){
        return this.orbitControls.target;
    }
    public update(){
        this.orbitControls.update();
        // this.dragControls.update();
    }
}


export class OrbitTransformControls{
    public transformControls: TransformControls;
    public orbitControls:  OrbitControls;
    public raycaster:  THREE.Raycaster;
    public objects: THREE.Object3D[];
    public scene: THREE.Scene;
    public camera: Camera;
    public domElem: HTMLElement;

    private transformEnabled = true;
    
    public currObj: THREE.Object3D | undefined;

    constructor(scene: THREE.Scene, objects: THREE.Object3D[], camera: Camera, domElem: HTMLElement){
        this.orbitControls = new OrbitControls(camera, domElem);
        this.raycaster = new THREE.Raycaster();
        this.objects = objects;
        this.scene = scene;
        this.camera = camera;
        this.domElem = domElem;
        domElem.addEventListener( 'mousedown', this.useRayCaster );
    }

    private useRayCaster = ( event: MouseEvent ) => {
        if(!this.transformEnabled) {
            this.orbitControls.enabled = true;
            return;
        };

        const canvasBounds = this.domElem.getBoundingClientRect()!;
        const x = ( ( event.clientX - canvasBounds.left ) / ( canvasBounds.right - canvasBounds.left ) ) * 2 - 1;
        const y = - ( ( event.clientY - canvasBounds.top ) / ( canvasBounds.bottom - canvasBounds.top) ) * 2 + 1;

        this.raycaster.setFromCamera( new THREE.Vector2(x, y), this.camera );
        
        //TODO: remove this map, we do it only cause the mesh of the sweep obj is inside the sweepObj itself
        //@ts-ignore
        const tempObjects = this.objects.map(o => o.mesh ?? o);
        const intersects = this.raycaster.intersectObjects( tempObjects, true  );
        
        
        if(intersects && intersects.length>0){
            if(this.currObj == intersects[0].object) return;
            this.disposeTransform();
            this.currObj = intersects[0].object;

            this.transformControls = new TransformControls(this.camera, this.domElem);
            this.transformControls.attach(this.currObj);
            this.transformControls.setMode('translate');
            this.scene.add(this.transformControls);
            this.transformControls.addEventListener('dragging-changed', (event) => {
                this.orbitControls.enabled = !event.value
            });
        }
    }

    public dispose(){
        this.orbitControls.dispose();
        this.disposeTransform();
    }

    private disposeTransform(){
        this.currObj = undefined;
        this.orbitControls.enabled = true;
        if(this.transformControls){
            this.transformControls.dispose();
            this.transformControls.removeFromParent();
        }
    }

    public getTarget(){
        return this.orbitControls.target;
    }

    public update(){
        this.orbitControls.update();
    }

    public enableTransform(){
        this.transformEnabled = true;
    }
    
    public disableTransform(){
        this.transformEnabled = false;
        this.disposeTransform();
    }
}