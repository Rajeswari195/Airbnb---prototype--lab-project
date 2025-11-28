import xml.etree.ElementTree as ET
from xml.dom import minidom

def create_jmx():
    jmeter_test_plan = ET.Element('jmeterTestPlan', version='1.2', properties='5.0', jmeter='5.6.3')
    hash_tree = ET.SubElement(jmeter_test_plan, 'hashTree')
    
    # Test Plan
    test_plan = ET.SubElement(hash_tree, 'TestPlan', guiclass='TestPlanGui', testclass='TestPlan', testname='Airbnb Performance Test', enabled='true')
    ET.SubElement(test_plan, 'stringProp', name='TestPlan.comments').text = ''
    ET.SubElement(test_plan, 'boolProp', name='TestPlan.functional_mode').text = 'false'
    ET.SubElement(test_plan, 'boolProp', name='TestPlan.tearDown_on_shutdown').text = 'true'
    ET.SubElement(test_plan, 'boolProp', name='TestPlan.serialize_threadgroups').text = 'false'
    ET.SubElement(test_plan, 'elementProp', name='TestPlan.user_defined_variables', elementType='Arguments', guiclass='ArgumentsPanel', testclass='Arguments', testname='User Defined Variables', enabled='true')
    ET.SubElement(test_plan, 'stringProp', name='TestPlan.user_define_classpath').text = ''
    
    hash_tree_tp = ET.SubElement(hash_tree, 'hashTree')

    # User Defined Variables
    args = ET.SubElement(hash_tree_tp, 'Arguments', guiclass='ArgumentsPanel', testclass='Arguments', testname='User Defined Variables', enabled='true')
    collection_prop = ET.SubElement(args, 'collectionProp', name='Arguments.arguments')
    
    def add_arg(name, value):
        elem = ET.SubElement(collection_prop, 'elementProp', name=name, elementType='Argument')
        ET.SubElement(elem, 'stringProp', name='Argument.name').text = name
        ET.SubElement(elem, 'stringProp', name='Argument.value').text = value
        ET.SubElement(elem, 'stringProp', name='Argument.metadata').text = '='

    add_arg('host_traveler', 'localhost')
    add_arg('port_traveler', '8000')
    add_arg('host_owner', 'localhost')
    add_arg('port_owner', '8001')
    
    hash_tree_tp.append(ET.Element('hashTree'))

    # HTTP Cookie Manager
    cookie_manager = ET.SubElement(hash_tree_tp, 'CookieManager', guiclass='CookiePanel', testclass='CookieManager', testname='HTTP Cookie Manager', enabled='true')
    ET.SubElement(cookie_manager, 'collectionProp', name='CookieManager.cookies')
    ET.SubElement(cookie_manager, 'boolProp', name='CookieManager.clearEachIteration').text = 'true'
    ET.SubElement(cookie_manager, 'boolProp', name='CookieManager.controlledByThreadGroup').text = 'false'
    hash_tree_tp.append(ET.Element('hashTree'))

    # HTTP Header Manager
    header_manager = ET.SubElement(hash_tree_tp, 'HeaderManager', guiclass='HeaderPanel', testclass='HeaderManager', testname='HTTP Header Manager', enabled='true')
    collection_prop_header = ET.SubElement(header_manager, 'collectionProp', name='HeaderManager.headers')
    header_elem = ET.SubElement(collection_prop_header, 'elementProp', name='', elementType='Header')
    ET.SubElement(header_elem, 'stringProp', name='Header.name').text = 'Content-Type'
    ET.SubElement(header_elem, 'stringProp', name='Header.value').text = 'application/json'
    hash_tree_tp.append(ET.Element('hashTree'))

    # --- Thread Group: Travelers ---
    tg_traveler = ET.SubElement(hash_tree_tp, 'ThreadGroup', guiclass='ThreadGroupGui', testclass='ThreadGroup', testname='Travelers', enabled='true')
    ET.SubElement(tg_traveler, 'stringProp', name='ThreadGroup.on_sample_error').text = 'continue'
    loop_controller = ET.SubElement(tg_traveler, 'elementProp', name='ThreadGroup.main_controller', elementType='LoopController', guiclass='LoopControlPanel', testclass='LoopController', testname='Loop Controller', enabled='true')
    ET.SubElement(loop_controller, 'boolProp', name='LoopController.continue_forever').text = 'false'
    ET.SubElement(loop_controller, 'stringProp', name='LoopController.loops').text = '1'
    ET.SubElement(tg_traveler, 'stringProp', name='ThreadGroup.num_threads').text = '${__P(users,10)}'
    ET.SubElement(tg_traveler, 'stringProp', name='ThreadGroup.ramp_time').text = '10'
    ET.SubElement(tg_traveler, 'boolProp', name='ThreadGroup.scheduler').text = 'false'
    ET.SubElement(tg_traveler, 'stringProp', name='ThreadGroup.duration').text = ''
    ET.SubElement(tg_traveler, 'stringProp', name='ThreadGroup.delay').text = ''
    ET.SubElement(tg_traveler, 'boolProp', name='ThreadGroup.same_user_on_next_iteration').text = 'true'

    hash_tree_traveler = ET.SubElement(hash_tree_tp, 'hashTree')

    # CSV Data Set Config (Travelers)
    csv_config = ET.SubElement(hash_tree_traveler, 'CSVDataSet', guiclass='TestBeanGUI', testclass='CSVDataSet', testname='CSV Data Set Config', enabled='true')
    ET.SubElement(csv_config, 'stringProp', name='filename').text = 'travelers.csv'
    ET.SubElement(csv_config, 'stringProp', name='fileEncoding').text = ''
    ET.SubElement(csv_config, 'stringProp', name='variableNames').text = 'email,password'
    ET.SubElement(csv_config, 'boolProp', name='ignoreFirstLine').text = 'false'
    ET.SubElement(csv_config, 'stringProp', name='delimiter').text = ','
    ET.SubElement(csv_config, 'boolProp', name='quotedData').text = 'false'
    ET.SubElement(csv_config, 'boolProp', name='recycle').text = 'true'
    ET.SubElement(csv_config, 'boolProp', name='stopThread').text = 'false'
    ET.SubElement(csv_config, 'stringProp', name='shareMode').text = 'shareMode.all'
    hash_tree_traveler.append(ET.Element('hashTree'))

    # 1. Login Request
    login_req = ET.SubElement(hash_tree_traveler, 'HTTPSamplerProxy', guiclass='HttpTestSampleGui', testclass='HTTPSamplerProxy', testname='Traveler Login', enabled='true')
    ET.SubElement(login_req, 'stringProp', name='HTTPSampler.domain').text = '${host_traveler}'
    ET.SubElement(login_req, 'stringProp', name='HTTPSampler.port').text = '${port_traveler}'
    ET.SubElement(login_req, 'stringProp', name='HTTPSampler.protocol').text = 'http'
    ET.SubElement(login_req, 'stringProp', name='HTTPSampler.path').text = '/api/auth/login'
    ET.SubElement(login_req, 'stringProp', name='HTTPSampler.method').text = 'POST'
    ET.SubElement(login_req, 'boolProp', name='HTTPSampler.follow_redirects').text = 'true'
    ET.SubElement(login_req, 'boolProp', name='HTTPSampler.auto_redirects').text = 'false'
    ET.SubElement(login_req, 'boolProp', name='HTTPSampler.use_keepalive').text = 'true'
    ET.SubElement(login_req, 'boolProp', name='HTTPSampler.DO_MULTIPART_POST').text = 'false'
    ET.SubElement(login_req, 'stringProp', name='HTTPSampler.embedded_url_re').text = ''
    ET.SubElement(login_req, 'stringProp', name='HTTPSampler.connect_timeout').text = ''
    ET.SubElement(login_req, 'stringProp', name='HTTPSampler.response_timeout').text = ''
    
    login_args = ET.SubElement(login_req, 'elementProp', name='HTTPsampler.Arguments', elementType='Arguments', guiclass='HTTPArgumentsPanel', testclass='Arguments', testname='User Defined Variables', enabled='true')
    login_coll = ET.SubElement(login_args, 'collectionProp', name='Arguments.arguments')
    
    body_arg = ET.SubElement(login_coll, 'elementProp', name='', elementType='HTTPArgument')
    ET.SubElement(body_arg, 'boolProp', name='HTTPArgument.always_encode').text = 'false'
    ET.SubElement(body_arg, 'stringProp', name='Argument.value').text = '{"email": "${email}", "password": "${password}"}'
    ET.SubElement(body_arg, 'stringProp', name='Argument.metadata').text = '='
    ET.SubElement(body_arg, 'boolProp', name='HTTPArgument.use_equals').text = 'true'
    ET.SubElement(login_req, 'boolProp', name='HTTPSampler.postBodyRaw').text = 'true'
    
    hash_tree_traveler.append(ET.Element('hashTree'))

    # 2. Search Request
    search_req = ET.SubElement(hash_tree_traveler, 'HTTPSamplerProxy', guiclass='HttpTestSampleGui', testclass='HTTPSamplerProxy', testname='Search Properties', enabled='true')
    ET.SubElement(search_req, 'stringProp', name='HTTPSampler.domain').text = '${host_traveler}'
    ET.SubElement(search_req, 'stringProp', name='HTTPSampler.port').text = '${port_traveler}'
    ET.SubElement(search_req, 'stringProp', name='HTTPSampler.protocol').text = 'http'
    ET.SubElement(search_req, 'stringProp', name='HTTPSampler.path').text = '/api/properties'
    ET.SubElement(search_req, 'stringProp', name='HTTPSampler.method').text = 'GET'
    ET.SubElement(search_req, 'boolProp', name='HTTPSampler.follow_redirects').text = 'true'
    ET.SubElement(search_req, 'boolProp', name='HTTPSampler.auto_redirects').text = 'false'
    ET.SubElement(search_req, 'boolProp', name='HTTPSampler.use_keepalive').text = 'true'
    
    hash_tree_search = ET.SubElement(hash_tree_traveler, 'hashTree')
    
    # JSON Extractor for Property ID
    extractor = ET.SubElement(hash_tree_search, 'JSONPostProcessor', guiclass='JSONPostProcessorGui', testclass='JSONPostProcessor', testname='Extract Property ID', enabled='true')
    ET.SubElement(extractor, 'stringProp', name='JSONPostProcessor.referenceNames').text = 'propertyId'
    ET.SubElement(extractor, 'stringProp', name='JSONPostProcessor.jsonPathExprs').text = '$..id'
    ET.SubElement(extractor, 'stringProp', name='JSONPostProcessor.match_numbers').text = '0' # Random
    ET.SubElement(extractor, 'stringProp', name='JSONPostProcessor.defaultValues').text = 'NOT_FOUND'

    # 3. Booking Request
    book_req = ET.SubElement(hash_tree_traveler, 'HTTPSamplerProxy', guiclass='HttpTestSampleGui', testclass='HTTPSamplerProxy', testname='Create Booking', enabled='true')
    ET.SubElement(book_req, 'stringProp', name='HTTPSampler.domain').text = '${host_traveler}'
    ET.SubElement(book_req, 'stringProp', name='HTTPSampler.port').text = '${port_traveler}'
    ET.SubElement(book_req, 'stringProp', name='HTTPSampler.protocol').text = 'http'
    ET.SubElement(book_req, 'stringProp', name='HTTPSampler.path').text = '/api/bookings'
    ET.SubElement(book_req, 'stringProp', name='HTTPSampler.method').text = 'POST'
    ET.SubElement(book_req, 'boolProp', name='HTTPSampler.postBodyRaw').text = 'true'
    
    book_args = ET.SubElement(book_req, 'elementProp', name='HTTPsampler.Arguments', elementType='Arguments', guiclass='HTTPArgumentsPanel', testclass='Arguments', testname='User Defined Variables', enabled='true')
    book_coll = ET.SubElement(book_args, 'collectionProp', name='Arguments.arguments')
    
    book_body_arg = ET.SubElement(book_coll, 'elementProp', name='', elementType='HTTPArgument')
    ET.SubElement(book_body_arg, 'boolProp', name='HTTPArgument.always_encode').text = 'false'
    # Use dynamic dates if possible, but hardcoded future dates are easier for load testing
    ET.SubElement(book_body_arg, 'stringProp', name='Argument.value').text = '{"propertyId": "${propertyId}", "startDate": "2025-12-01", "endDate": "2025-12-05", "guests": 1}'
    ET.SubElement(book_body_arg, 'stringProp', name='Argument.metadata').text = '='
    
    hash_tree_traveler.append(ET.Element('hashTree'))

    # --- Thread Group: Owners ---
    tg_owner = ET.SubElement(hash_tree_tp, 'ThreadGroup', guiclass='ThreadGroupGui', testclass='ThreadGroup', testname='Owners', enabled='true')
    ET.SubElement(tg_owner, 'stringProp', name='ThreadGroup.on_sample_error').text = 'continue'
    loop_controller_owner = ET.SubElement(tg_owner, 'elementProp', name='ThreadGroup.main_controller', elementType='LoopController', guiclass='LoopControlPanel', testclass='LoopController', testname='Loop Controller', enabled='true')
    ET.SubElement(loop_controller_owner, 'boolProp', name='LoopController.continue_forever').text = 'false'
    ET.SubElement(loop_controller_owner, 'stringProp', name='LoopController.loops').text = '1'
    ET.SubElement(tg_owner, 'stringProp', name='ThreadGroup.num_threads').text = '${__P(owners,5)}'
    ET.SubElement(tg_owner, 'stringProp', name='ThreadGroup.ramp_time').text = '10'
    ET.SubElement(tg_owner, 'boolProp', name='ThreadGroup.scheduler').text = 'false'
    ET.SubElement(tg_owner, 'boolProp', name='ThreadGroup.same_user_on_next_iteration').text = 'true'

    hash_tree_owner = ET.SubElement(hash_tree_tp, 'hashTree')

    # CSV Data Set Config (Owners)
    csv_config_owner = ET.SubElement(hash_tree_owner, 'CSVDataSet', guiclass='TestBeanGUI', testclass='CSVDataSet', testname='CSV Data Set Config', enabled='true')
    ET.SubElement(csv_config_owner, 'stringProp', name='filename').text = 'owners.csv'
    ET.SubElement(csv_config_owner, 'stringProp', name='variableNames').text = 'email,password'
    ET.SubElement(csv_config_owner, 'boolProp', name='ignoreFirstLine').text = 'false'
    ET.SubElement(csv_config_owner, 'stringProp', name='delimiter').text = ','
    ET.SubElement(csv_config_owner, 'boolProp', name='quotedData').text = 'false'
    ET.SubElement(csv_config_owner, 'boolProp', name='recycle').text = 'true'
    ET.SubElement(csv_config_owner, 'boolProp', name='stopThread').text = 'false'
    ET.SubElement(csv_config_owner, 'stringProp', name='shareMode').text = 'shareMode.all'
    hash_tree_owner.append(ET.Element('hashTree'))

    # 1. Login (Traveler side)
    login_req_o = ET.SubElement(hash_tree_owner, 'HTTPSamplerProxy', guiclass='HttpTestSampleGui', testclass='HTTPSamplerProxy', testname='Owner Login (Traveler API)', enabled='true')
    ET.SubElement(login_req_o, 'stringProp', name='HTTPSampler.domain').text = '${host_traveler}'
    ET.SubElement(login_req_o, 'stringProp', name='HTTPSampler.port').text = '${port_traveler}'
    ET.SubElement(login_req_o, 'stringProp', name='HTTPSampler.protocol').text = 'http'
    ET.SubElement(login_req_o, 'stringProp', name='HTTPSampler.path').text = '/api/auth/login'
    ET.SubElement(login_req_o, 'stringProp', name='HTTPSampler.method').text = 'POST'
    ET.SubElement(login_req_o, 'boolProp', name='HTTPSampler.postBodyRaw').text = 'true'
    
    login_args_o = ET.SubElement(login_req_o, 'elementProp', name='HTTPsampler.Arguments', elementType='Arguments', guiclass='HTTPArgumentsPanel', testclass='Arguments', testname='User Defined Variables', enabled='true')
    login_coll_o = ET.SubElement(login_args_o, 'collectionProp', name='Arguments.arguments')
    body_arg_o = ET.SubElement(login_coll_o, 'elementProp', name='', elementType='HTTPArgument')
    ET.SubElement(body_arg_o, 'stringProp', name='Argument.value').text = '{"email": "${email}", "password": "${password}"}'
    ET.SubElement(body_arg_o, 'stringProp', name='Argument.metadata').text = '='
    
    hash_tree_owner.append(ET.Element('hashTree'))

    # 2. Get Session Token
    token_req = ET.SubElement(hash_tree_owner, 'HTTPSamplerProxy', guiclass='HttpTestSampleGui', testclass='HTTPSamplerProxy', testname='Get Session Token', enabled='true')
    ET.SubElement(token_req, 'stringProp', name='HTTPSampler.domain').text = '${host_traveler}'
    ET.SubElement(token_req, 'stringProp', name='HTTPSampler.port').text = '${port_traveler}'
    ET.SubElement(token_req, 'stringProp', name='HTTPSampler.protocol').text = 'http'
    ET.SubElement(token_req, 'stringProp', name='HTTPSampler.path').text = '/api/auth/session-token'
    ET.SubElement(token_req, 'stringProp', name='HTTPSampler.method').text = 'POST'
    
    hash_tree_token = ET.SubElement(hash_tree_owner, 'hashTree')
    extractor_token = ET.SubElement(hash_tree_token, 'JSONPostProcessor', guiclass='JSONPostProcessorGui', testclass='JSONPostProcessor', testname='Extract Token', enabled='true')
    ET.SubElement(extractor_token, 'stringProp', name='JSONPostProcessor.referenceNames').text = 'token'
    ET.SubElement(extractor_token, 'stringProp', name='JSONPostProcessor.jsonPathExprs').text = '$.token'
    ET.SubElement(extractor_token, 'stringProp', name='JSONPostProcessor.match_numbers').text = '1'
    ET.SubElement(extractor_token, 'stringProp', name='JSONPostProcessor.defaultValues').text = 'NOT_FOUND'

    # 3. Exchange Token
    exchange_req = ET.SubElement(hash_tree_owner, 'HTTPSamplerProxy', guiclass='HttpTestSampleGui', testclass='HTTPSamplerProxy', testname='Exchange Token', enabled='true')
    ET.SubElement(exchange_req, 'stringProp', name='HTTPSampler.domain').text = '${host_owner}'
    ET.SubElement(exchange_req, 'stringProp', name='HTTPSampler.port').text = '${port_owner}'
    ET.SubElement(exchange_req, 'stringProp', name='HTTPSampler.protocol').text = 'http'
    ET.SubElement(exchange_req, 'stringProp', name='HTTPSampler.path').text = '/api/auth/exchange'
    ET.SubElement(exchange_req, 'stringProp', name='HTTPSampler.method').text = 'POST'
    ET.SubElement(exchange_req, 'boolProp', name='HTTPSampler.postBodyRaw').text = 'true'
    
    exchange_args = ET.SubElement(exchange_req, 'elementProp', name='HTTPsampler.Arguments', elementType='Arguments', guiclass='HTTPArgumentsPanel', testclass='Arguments', testname='User Defined Variables', enabled='true')
    exchange_coll = ET.SubElement(exchange_args, 'collectionProp', name='Arguments.arguments')
    body_arg_ex = ET.SubElement(exchange_coll, 'elementProp', name='', elementType='HTTPArgument')
    ET.SubElement(body_arg_ex, 'stringProp', name='Argument.value').text = '{"token": "${token}"}'
    ET.SubElement(body_arg_ex, 'stringProp', name='Argument.metadata').text = '='
    
    hash_tree_owner.append(ET.Element('hashTree'))

    # 4. Get Incoming Bookings
    incoming_req = ET.SubElement(hash_tree_owner, 'HTTPSamplerProxy', guiclass='HttpTestSampleGui', testclass='HTTPSamplerProxy', testname='Get Incoming Bookings', enabled='true')
    ET.SubElement(incoming_req, 'stringProp', name='HTTPSampler.domain').text = '${host_owner}'
    ET.SubElement(incoming_req, 'stringProp', name='HTTPSampler.port').text = '${port_owner}'
    ET.SubElement(incoming_req, 'stringProp', name='HTTPSampler.protocol').text = 'http'
    ET.SubElement(incoming_req, 'stringProp', name='HTTPSampler.path').text = '/api/bookings/incoming'
    ET.SubElement(incoming_req, 'stringProp', name='HTTPSampler.method').text = 'GET'
    
    hash_tree_incoming = ET.SubElement(hash_tree_owner, 'hashTree')
    extractor_booking = ET.SubElement(hash_tree_incoming, 'JSONPostProcessor', guiclass='JSONPostProcessorGui', testclass='JSONPostProcessor', testname='Extract Booking ID', enabled='true')
    ET.SubElement(extractor_booking, 'stringProp', name='JSONPostProcessor.referenceNames').text = 'bookingId'
    ET.SubElement(extractor_booking, 'stringProp', name='JSONPostProcessor.jsonPathExprs').text = '$..id'
    ET.SubElement(extractor_booking, 'stringProp', name='JSONPostProcessor.match_numbers').text = '1' # First one
    ET.SubElement(extractor_booking, 'stringProp', name='JSONPostProcessor.defaultValues').text = 'NOT_FOUND'

    # 5. Accept Booking (If found)
    # Use If Controller to check if bookingId != NOT_FOUND
    if_ctrl = ET.SubElement(hash_tree_owner, 'IfController', guiclass='IfControllerPanel', testclass='IfController', testname='If Booking Found', enabled='true')
    ET.SubElement(if_ctrl, 'stringProp', name='IfController.condition').text = '"${bookingId}" != "NOT_FOUND"'
    ET.SubElement(if_ctrl, 'boolProp', name='IfController.evaluateAll').text = 'false'
    ET.SubElement(if_ctrl, 'boolProp', name='IfController.useExpression').text = 'true'
    
    hash_tree_if = ET.SubElement(hash_tree_owner, 'hashTree')
    
    accept_req = ET.SubElement(hash_tree_if, 'HTTPSamplerProxy', guiclass='HttpTestSampleGui', testclass='HTTPSamplerProxy', testname='Accept Booking', enabled='true')
    ET.SubElement(accept_req, 'stringProp', name='HTTPSampler.domain').text = '${host_owner}'
    ET.SubElement(accept_req, 'stringProp', name='HTTPSampler.port').text = '${port_owner}'
    ET.SubElement(accept_req, 'stringProp', name='HTTPSampler.protocol').text = 'http'
    ET.SubElement(accept_req, 'stringProp', name='HTTPSampler.path').text = '/api/bookings/${bookingId}/accept'
    ET.SubElement(accept_req, 'stringProp', name='HTTPSampler.method').text = 'POST'
    
    hash_tree_if.append(ET.Element('hashTree'))

    # Results Tree (for debugging, disabled for load test usually but good to have)
    # result_tree = ET.SubElement(hash_tree_tp, 'ResultCollector', guiclass='ViewResultsFullVisualizer', testclass='ResultCollector', testname='View Results Tree', enabled='true')
    # hash_tree_tp.append(ET.Element('hashTree'))

    # Save to file
    tree = ET.ElementTree(jmeter_test_plan)
    with open('airbnb_performance_test.jmx', 'wb') as f:
        tree.write(f, encoding='UTF-8', xml_declaration=True)

if __name__ == '__main__':
    create_jmx()
    print("Generated airbnb_performance_test.jmx")
